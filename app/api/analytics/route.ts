import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertAnalyticsEvents, type TrackEventInput } from "@/lib/analytics";
import { isValidEvent, type Platform } from "@/lib/analytics-events";

// Payload guards — this is a public, unauthenticated-tolerant beacon endpoint.
const MAX_BODY_BYTES = 64 * 1024;
const MAX_BATCH = 50;
const MAX_PROPS_BYTES = 4 * 1024;
const VALID_PLATFORMS = new Set<Platform>(["web", "ios", "android"]);

function str(v: unknown, max: number): string | null {
  return typeof v === "string" ? v.slice(0, max) : null;
}

/** Reject oversized property blobs so no PII/huge payload lands in the column. */
function clampProps(p: unknown): Record<string, unknown> | null {
  if (!p || typeof p !== "object") return null;
  try {
    if (JSON.stringify(p).length > MAX_PROPS_BYTES) return null;
  } catch {
    return null;
  }
  return p as Record<string, unknown>;
}

// POST /api/analytics
//
// Two shapes:
//  1. Legacy single  — { event, page, metadata }              (current web hook)
//  2. Batch          — { anonId, sessionId, env, events[] }   (mobile offline queue + Phase 2 web)
//     env: { platform, appVersion, osVersion, deviceModel }
//     events[]: { eventId, event, page?, properties?, clientTs? }
//
// Always returns 200 (never fail the client). userId is set SERVER-side from the
// session, never trusted from the client. Unknown events are dropped silently.
// Idempotency: events carry a client-minted eventId; insert dedupes on it.
export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: true, dropped: "payload_too_large" });
    }
    const body = raw ? JSON.parse(raw) : {};

    const session = await auth();
    const userId = session?.user?.id ?? null;

    // ── Batch shape ──────────────────────────────────────────────────────
    if (Array.isArray(body.events)) {
      const env = (body.env && typeof body.env === "object" ? body.env : {}) as Record<string, unknown>;
      const platform: Platform = VALID_PLATFORMS.has(env.platform as Platform)
        ? (env.platform as Platform)
        : "web";
      const anonId = str(body.anonId, 100);
      const sessionId = str(body.sessionId, 100);
      const appVersion = str(env.appVersion, 50);
      const osVersion = str(env.osVersion, 50);
      const deviceModel = str(env.deviceModel, 50);

      const inputs: TrackEventInput[] = [];
      for (const ev of body.events.slice(0, MAX_BATCH)) {
        if (!ev || !isValidEvent(ev.event)) continue; // drop unknown/malformed
        inputs.push({
          event: ev.event,
          eventId: str(ev.eventId, 64),
          userId, // server-set
          anonId,
          sessionId,
          platform,
          appVersion,
          osVersion,
          deviceModel,
          page: str(ev.page, 500),
          properties: clampProps(ev.properties),
          clientTs: typeof ev.clientTs === "number" ? ev.clientTs : null,
        });
      }
      await insertAnalyticsEvents(inputs);
      return NextResponse.json({ ok: true, accepted: inputs.length });
    }

    // ── Legacy single-event shape ────────────────────────────────────────
    const { event, page, metadata } = body;
    if (!isValidEvent(event)) {
      // Drop (don't 400) so a stale client never breaks on a retired event name.
      return NextResponse.json({ ok: true, dropped: "unknown_event" });
    }
    await insertAnalyticsEvents([
      {
        event,
        userId,
        platform: "web",
        page: str(page, 500),
        metadata: clampProps(metadata),
      },
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never fail the client
  }
}
