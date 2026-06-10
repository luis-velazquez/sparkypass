import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";
import { db, analyticsEvents } from "@/lib/db";
import { EVENT_CATALOG, type EventName, type Platform } from "@/lib/analytics-events";

export interface TrackEventInput {
  event: EventName;
  /** Set SERVER-side from the session — never trusted from the client. */
  userId?: string | null;
  anonId?: string | null;
  sessionId?: string | null;
  platform?: Platform;
  appVersion?: string | null;
  osVersion?: string | null;
  deviceModel?: string | null;
  page?: string | null;
  /** Typed per-event payload (new writes). */
  properties?: Record<string, unknown> | null;
  /** Legacy blob column — kept for the old single-event client path. */
  metadata?: Record<string, unknown> | null;
  /** Unix-ms on-device event time (offline ordering). */
  clientTs?: number | null;
  /** Client-minted UUID — idempotency key; dedupes offline batch retries. */
  eventId?: string | null;
}

function buildRow(input: TrackEventInput) {
  // funnel/step are derived from the catalog SERVER-side so they can't drift.
  const meta = EVENT_CATALOG[input.event];
  return {
    id: crypto.randomUUID(),
    eventId: input.eventId ?? null,
    userId: input.userId ?? null,
    anonId: input.anonId ?? null,
    sessionId: input.sessionId ?? null,
    event: input.event,
    funnel: meta?.funnel ?? null,
    step: meta?.step ?? null,
    platform: input.platform ?? "web",
    appVersion: input.appVersion ?? null,
    osVersion: input.osVersion ?? null,
    deviceModel: input.deviceModel ?? null,
    page: input.page ? input.page.slice(0, 500) : null,
    properties: input.properties ? JSON.stringify(input.properties) : null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    clientTs: input.clientTs ?? null,
    // createdAt defaulted in schema ($defaultFn).
  };
}

/**
 * Insert a batch of analytics events. Idempotent on `event_id` (offline retries
 * dedupe via ON CONFLICT DO NOTHING). Non-blocking — failures are logged +
 * reported to Sentry but never thrown, so analytics can't break a request.
 */
export async function insertAnalyticsEvents(inputs: TrackEventInput[]): Promise<void> {
  if (inputs.length === 0) return;
  try {
    await db.insert(analyticsEvents).values(inputs.map(buildRow)).onConflictDoNothing();
  } catch (error) {
    console.error("[ANALYTICS] insert failed:", error);
    // The route always returns 200, so without this a DB failure is invisible.
    Sentry.captureException(error, { tags: { area: "analytics-ingest" } });
  }
}

/** Track a single server-side analytics event (Phase 3 emit sites call this). */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  await insertAnalyticsEvents([input]);
}
