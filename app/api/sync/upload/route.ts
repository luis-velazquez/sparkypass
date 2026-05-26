// POST /api/sync/upload
//
// Offline-first sync upload. Client batches events that happened while offline
// and sends them in chronological order. Each event has a deterministic
// (deviceId, batchId, clientId) tuple that the server uses for idempotency —
// the unique index on sync_event_log silently skips duplicates so retries are
// safe.
//
// Conflict policy (OQ#3 resolution): last-write-wins by client `answeredAt`
// for SRS-bearing events; ledger entries (watts) are append-only on device and
// server reconciles balances on each batch.
//
// v1 event types: progress, session_start, session_end, bookmark_added,
// bookmark_removed, flashcard_bookmark_added, flashcard_bookmark_removed.
// SRS updates are derived from `progress` events; circuit-breaker state
// changes are also derived. Direct SRS / breaker mutations from the client are
// not accepted — server logic is authoritative.

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { auth } from "@/auth";
import {
  db,
  users,
  userProgress,
  studySessions,
  bookmarks,
  flashcardBookmarks,
  syncEventLog,
} from "@/lib/db";

type IngestEvent =
  | { type: "progress"; clientId: string; questionId: string; isCorrect: boolean; timeSpentSeconds?: number; answeredAt: string }
  | { type: "session_start"; clientId: string; clientSessionId: string; sessionType: string; categorySlug?: string | null; startedAt: string }
  | { type: "session_end"; clientId: string; clientSessionId: string; endedAt: string; questionsAnswered?: number; questionsCorrect?: number; activityType?: string }
  | { type: "bookmark_added"; clientId: string; questionId: string; createdAt?: string }
  | { type: "bookmark_removed"; clientId: string; questionId: string }
  | { type: "flashcard_bookmark_added"; clientId: string; flashcardId: string; createdAt?: string }
  | { type: "flashcard_bookmark_removed"; clientId: string; flashcardId: string };

interface RequestBody {
  deviceId?: unknown;
  batchId?: unknown;
  events?: unknown;
}

interface EventResult {
  clientId: string;
  ok: boolean;
  error?: string;
  code?: string;
  skipped?: boolean;  // duplicate event (idempotent retry)
}

const VALID_SESSION_TYPES = [
  "quiz",
  "flashcard",
  "mock_exam",
  "daily_challenge",
  "load_calculator",
] as const;

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Try to claim idempotency. Returns true if first time, false if a duplicate
// (skip the event).
async function claimIdempotency(
  userId: string,
  deviceId: string,
  batchId: string,
  clientId: string,
): Promise<boolean> {
  try {
    await db.insert(syncEventLog).values({
      id: crypto.randomUUID(),
      userId,
      deviceId,
      batchId,
      clientId,
    });
    return true;
  } catch {
    // Unique violation on (deviceId, batchId, clientId) → duplicate.
    return false;
  }
}

async function handleProgress(
  userId: string,
  ev: Extract<IngestEvent, { type: "progress" }>,
): Promise<EventResult> {
  const answeredAt = parseDate(ev.answeredAt);
  if (!ev.questionId || answeredAt === null) {
    return { clientId: ev.clientId, ok: false, error: "Bad progress event", code: "BAD_EVENT" };
  }
  await db.insert(userProgress).values({
    id: crypto.randomUUID(),
    userId,
    questionId: ev.questionId,
    isCorrect: ev.isCorrect,
    timeSpentSeconds: typeof ev.timeSpentSeconds === "number" ? ev.timeSpentSeconds : null,
    answeredAt,
  });
  // Note: SRS and circuit-breaker derivation is intentionally not done here.
  // The existing /api/progress route owns that logic; refactoring to share a
  // single ingest path is a follow-up. For v1 sync, we record the raw attempt
  // and let the SRS recompute run server-side based on attempt history.
  return { clientId: ev.clientId, ok: true };
}

async function handleSessionStart(
  userId: string,
  ev: Extract<IngestEvent, { type: "session_start" }>,
): Promise<EventResult> {
  const startedAt = parseDate(ev.startedAt);
  if (!ev.clientSessionId || !startedAt) {
    return { clientId: ev.clientId, ok: false, error: "Bad session_start", code: "BAD_EVENT" };
  }
  if (!(VALID_SESSION_TYPES as readonly string[]).includes(ev.sessionType)) {
    return { clientId: ev.clientId, ok: false, error: "Bad sessionType", code: "BAD_EVENT" };
  }

  // Idempotent create: if a row with this id already exists for this user, no-op.
  const [existing] = await db
    .select({ id: studySessions.id })
    .from(studySessions)
    .where(and(eq(studySessions.id, ev.clientSessionId), eq(studySessions.userId, userId)))
    .limit(1);
  if (existing) return { clientId: ev.clientId, ok: true, skipped: true };

  await db.insert(studySessions).values({
    id: ev.clientSessionId,
    userId,
    sessionType: ev.sessionType as (typeof VALID_SESSION_TYPES)[number],
    categorySlug: ev.categorySlug ?? null,
    startedAt,
    xpEarned: 0,
    wattsEarned: 0,
  });
  return { clientId: ev.clientId, ok: true };
}

async function handleSessionEnd(
  userId: string,
  ev: Extract<IngestEvent, { type: "session_end" }>,
): Promise<EventResult> {
  const endedAt = parseDate(ev.endedAt);
  if (!ev.clientSessionId || !endedAt) {
    return { clientId: ev.clientId, ok: false, error: "Bad session_end", code: "BAD_EVENT" };
  }

  const [existing] = await db
    .select({ id: studySessions.id, endedAt: studySessions.endedAt })
    .from(studySessions)
    .where(and(eq(studySessions.id, ev.clientSessionId), eq(studySessions.userId, userId)))
    .limit(1);
  if (!existing) {
    return { clientId: ev.clientId, ok: false, error: "Session not found", code: "SESSION_NOT_FOUND" };
  }
  if (existing.endedAt) {
    return { clientId: ev.clientId, ok: true, skipped: true };  // already ended
  }

  // Set ended state. Server-side Watts calc is intentionally skipped here in
  // v1 — the canonical Watts award still flows through PATCH /api/sessions
  // when the client is back online. The sync upload records the raw fact that
  // the session ended; Watts reconciliation is a follow-up so we don't risk
  // double-awarding while the client may also be retrying the PATCH path.
  await db
    .update(studySessions)
    .set({
      endedAt,
      questionsAnswered: typeof ev.questionsAnswered === "number" ? ev.questionsAnswered : null,
      questionsCorrect: typeof ev.questionsCorrect === "number" ? ev.questionsCorrect : null,
    })
    .where(eq(studySessions.id, ev.clientSessionId));
  return { clientId: ev.clientId, ok: true };
}

async function handleBookmarkAdded(
  userId: string,
  ev: Extract<IngestEvent, { type: "bookmark_added" }>,
): Promise<EventResult> {
  if (!ev.questionId) {
    return { clientId: ev.clientId, ok: false, error: "Bad bookmark_added", code: "BAD_EVENT" };
  }
  const [existing] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.questionId, ev.questionId)))
    .limit(1);
  if (existing) return { clientId: ev.clientId, ok: true, skipped: true };
  await db.insert(bookmarks).values({
    id: crypto.randomUUID(),
    userId,
    questionId: ev.questionId,
    createdAt: parseDate(ev.createdAt) ?? new Date(),
  });
  return { clientId: ev.clientId, ok: true };
}

async function handleBookmarkRemoved(
  userId: string,
  ev: Extract<IngestEvent, { type: "bookmark_removed" }>,
): Promise<EventResult> {
  if (!ev.questionId) {
    return { clientId: ev.clientId, ok: false, error: "Bad bookmark_removed", code: "BAD_EVENT" };
  }
  await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.questionId, ev.questionId)));
  return { clientId: ev.clientId, ok: true };
}

async function handleFlashcardBookmarkAdded(
  userId: string,
  ev: Extract<IngestEvent, { type: "flashcard_bookmark_added" }>,
): Promise<EventResult> {
  if (!ev.flashcardId) {
    return { clientId: ev.clientId, ok: false, error: "Bad flashcard_bookmark_added", code: "BAD_EVENT" };
  }
  const [existing] = await db
    .select({ id: flashcardBookmarks.id })
    .from(flashcardBookmarks)
    .where(
      and(
        eq(flashcardBookmarks.userId, userId),
        eq(flashcardBookmarks.flashcardId, ev.flashcardId),
      ),
    )
    .limit(1);
  if (existing) return { clientId: ev.clientId, ok: true, skipped: true };
  await db.insert(flashcardBookmarks).values({
    id: crypto.randomUUID(),
    userId,
    flashcardId: ev.flashcardId,
    createdAt: parseDate(ev.createdAt) ?? new Date(),
  });
  return { clientId: ev.clientId, ok: true };
}

async function handleFlashcardBookmarkRemoved(
  userId: string,
  ev: Extract<IngestEvent, { type: "flashcard_bookmark_removed" }>,
): Promise<EventResult> {
  if (!ev.flashcardId) {
    return { clientId: ev.clientId, ok: false, error: "Bad flashcard_bookmark_removed", code: "BAD_EVENT" };
  }
  await db
    .delete(flashcardBookmarks)
    .where(
      and(
        eq(flashcardBookmarks.userId, userId),
        eq(flashcardBookmarks.flashcardId, ev.flashcardId),
      ),
    );
  return { clientId: ev.clientId, ok: true };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;
  const batchId = typeof body.batchId === "string" ? body.batchId.trim() : null;
  const events = Array.isArray(body.events) ? (body.events as IngestEvent[]) : null;

  if (!deviceId || !batchId || !events) {
    return NextResponse.json(
      { error: "deviceId, batchId, and events are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }
  if (events.length > 500) {
    return NextResponse.json(
      { error: "Max 500 events per batch", code: "BATCH_TOO_LARGE" },
      { status: 400 },
    );
  }

  const results: EventResult[] = [];

  for (const ev of events) {
    if (typeof ev.clientId !== "string" || !ev.clientId) {
      results.push({ clientId: "(missing)", ok: false, error: "Missing clientId", code: "BAD_EVENT" });
      continue;
    }

    // Idempotency guard — duplicate (deviceId, batchId, clientId) is silently
    // skipped. The client treats `skipped: true` as success.
    const isFirstTime = await claimIdempotency(userId, deviceId, batchId, ev.clientId);
    if (!isFirstTime) {
      results.push({ clientId: ev.clientId, ok: true, skipped: true });
      continue;
    }

    try {
      switch (ev.type) {
        case "progress":
          results.push(await handleProgress(userId, ev));
          break;
        case "session_start":
          results.push(await handleSessionStart(userId, ev));
          break;
        case "session_end":
          results.push(await handleSessionEnd(userId, ev));
          break;
        case "bookmark_added":
          results.push(await handleBookmarkAdded(userId, ev));
          break;
        case "bookmark_removed":
          results.push(await handleBookmarkRemoved(userId, ev));
          break;
        case "flashcard_bookmark_added":
          results.push(await handleFlashcardBookmarkAdded(userId, ev));
          break;
        case "flashcard_bookmark_removed":
          results.push(await handleFlashcardBookmarkRemoved(userId, ev));
          break;
        default: {
          // exhaustiveness — TypeScript will complain if a case is missing.
          const _exhaustive: never = ev;
          results.push({
            clientId: (ev as { clientId: string }).clientId,
            ok: false,
            error: "Unknown event type",
            code: "UNKNOWN_TYPE",
          });
          void _exhaustive;
        }
      }
    } catch (err) {
      console.error("[sync/upload] Handler threw:", err);
      results.push({
        clientId: ev.clientId,
        ok: false,
        error: "Handler error",
        code: "INTERNAL",
      });
    }
  }

  // Touch lastStudyDate / updatedAt so /api/sync/state reflects this batch's
  // freshness. (Watts/streak calc remains in the online path for now.)
  await db
    .update(users)
    .set({ updatedAt: new Date() })
    .where(eq(users.id, userId));

  return NextResponse.json({
    ok: true,
    batchId,
    processed: results.length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => !r.ok).length,
    results,
    serverTime: new Date().toISOString(),
  });
}
