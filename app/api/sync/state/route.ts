// GET /api/sync/state?since=<iso8601>
//
// Server-canonical state pull. Mobile client calls this after a successful
// upload (or on cold boot) to reconcile local SQLite with the server. Delta-
// based: pass `since` to get only rows changed/created after that timestamp.
//
// v1 state surface:
//   - user: hot-path user fields (Watts/Voltage/Amps/streak/subscription)
//   - bookmarks: added after `since`
//   - flashcardBookmarks: added after `since`
//
// Deferred to a follow-up sync iteration:
//   - questionSrs deltas (the client needs these to render Power Grid; for v1
//     the Power Grid screen can hit /api/power-grid/[category] directly)
//   - circuitBreakerState deltas (same reasoning — fetched via existing
//     /api/circuit-breaker/status on screen open)
//   - watts transactions deltas (the ledger UI uses its own paginated API)

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users, bookmarks, flashcardBookmarks } from "@/lib/db";
import { isStreakSkipAvailable, streakSkipResetsAt } from "@/lib/streak";

const MAX_DELTA_ROWS = 1000;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;
  if (since && Number.isNaN(since.getTime())) {
    return NextResponse.json(
      { error: "since must be a valid ISO 8601 timestamp", code: "BAD_CURSOR" },
      { status: 400 },
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      username: users.username,
      wattsBalance: users.wattsBalance,
      wattsLifetime: users.wattsLifetime,
      level: users.level,
      ampsBase: users.ampsBase,
      studyStreak: users.studyStreak,
      bestStudyStreak: users.bestStudyStreak,
      lastStudyDate: users.lastStudyDate,
      streakSkipUsedAt: users.streakSkipUsedAt,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionSource: users.subscriptionSource,
      subscriptionPeriodEnd: users.subscriptionPeriodEnd,
      trialEndsAt: users.trialEndsAt,
      timezone: users.timezone,
      notificationPrefs: users.notificationPrefs,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const bookmarkWhere = since
    ? and(eq(bookmarks.userId, userId), gt(bookmarks.createdAt, since))
    : eq(bookmarks.userId, userId);
  const bookmarkRows = await db
    .select({
      id: bookmarks.id,
      questionId: bookmarks.questionId,
      createdAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .where(bookmarkWhere)
    .limit(MAX_DELTA_ROWS);

  const flashcardBookmarkWhere = since
    ? and(eq(flashcardBookmarks.userId, userId), gt(flashcardBookmarks.createdAt, since))
    : eq(flashcardBookmarks.userId, userId);
  const flashcardBookmarkRows = await db
    .select({
      id: flashcardBookmarks.id,
      flashcardId: flashcardBookmarks.flashcardId,
      createdAt: flashcardBookmarks.createdAt,
    })
    .from(flashcardBookmarks)
    .where(flashcardBookmarkWhere)
    .limit(MAX_DELTA_ROWS);

  // Emit the SAME derived streak-skip shape as GET /api/user (not the raw column),
  // so this blob and /api/user are interchangeable in the mobile AuthUser cache.
  const now = new Date();
  const { streakSkipUsedAt, ...userRest } = user;

  return NextResponse.json({
    serverTime: now.toISOString(),
    recommendedNextSince: now.toISOString(),  // client caches this for the next GET
    user: {
      ...userRest,
      lastStudyDate: user.lastStudyDate?.toISOString() ?? null,
      streakSkipAvailable: isStreakSkipAvailable(streakSkipUsedAt, now),
      streakSkipResetsAt: streakSkipResetsAt(streakSkipUsedAt, now),
      subscriptionPeriodEnd: user.subscriptionPeriodEnd?.toISOString() ?? null,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
      updatedAt: user.updatedAt?.toISOString() ?? null,
    },
    bookmarks: bookmarkRows.map((b: typeof bookmarkRows[number]) => ({
      ...b,
      createdAt: b.createdAt?.toISOString() ?? null,
    })),
    flashcardBookmarks: flashcardBookmarkRows.map(
      (b: typeof flashcardBookmarkRows[number]) => ({
        ...b,
        createdAt: b.createdAt?.toISOString() ?? null,
      }),
    ),
  });
}
