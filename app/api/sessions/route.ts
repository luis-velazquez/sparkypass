import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, studySessions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { awardSession } from "@/lib/award-session";
import { PORTA_JON_ACTIVITY_TYPE, portaJonCooldownRemaining } from "@/lib/porta-jon";

// POST - Create a new study session.
//
// Idempotency (audit Section 4 — Polish & tooling): client may pass an optional
// `clientSessionId` (UUID generated on device) so that an offline session
// reaches the server with a stable identity. Two cases:
//   1. clientSessionId not supplied → server mints a UUID (legacy behavior).
//   2. clientSessionId supplied + session already exists for this user → return
//      the existing row (idempotent create). Without this, a retry on flaky
//      network would create duplicate sessions.
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionType, categorySlug, clientSessionId } = body;

    if (!sessionType || !["quiz", "flashcard", "mock_exam", "daily_challenge", "load_calculator"].includes(sessionType)) {
      return NextResponse.json(
        { error: "Invalid session type" },
        { status: 400 }
      );
    }

    // Idempotent create: if the client supplied an id and it already maps to a
    // session for this user, return it instead of inserting a duplicate.
    if (typeof clientSessionId === "string" && clientSessionId.length > 0) {
      const [existing] = await db
        .select({ id: studySessions.id })
        .from(studySessions)
        .where(
          and(
            eq(studySessions.id, clientSessionId),
            eq(studySessions.userId, session.user.id),
          ),
        )
        .limit(1);
      if (existing) {
        return NextResponse.json({
          success: true,
          sessionId: existing.id,
          idempotent: true,
        });
      }
    }

    const sessionId =
      typeof clientSessionId === "string" && clientSessionId.length > 0
        ? clientSessionId
        : crypto.randomUUID();

    await db.insert(studySessions).values({
      id: sessionId,
      userId: session.user.id,
      sessionType,
      categorySlug: categorySlug || null,
      startedAt: new Date(),
      xpEarned: 0,
      wattsEarned: 0,
    });

    return NextResponse.json({
      success: true,
      sessionId,
      idempotent: false,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - End a study session and award watts (calculated server-side)
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, activityType = "quiz_complete", questionsAnswered, questionsCorrect } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Idempotency: a PATCH-to-end on a session that's already ended is treated
    // as a duplicate (likely retry after flaky network). Return the existing
    // wattsEarned + balance instead of re-processing — without this, an offline
    // client that retries would double-award Watts.
    const [existingSession] = await db
      .select({
        id: studySessions.id,
        endedAt: studySessions.endedAt,
        wattsEarned: studySessions.wattsEarned,
      })
      .from(studySessions)
      .where(
        and(
          eq(studySessions.id, sessionId),
          eq(studySessions.userId, session.user.id),
        ),
      )
      .limit(1);
    if (existingSession?.endedAt) {
      const [u] = await db
        .select({ wattsBalance: users.wattsBalance, studyStreak: users.studyStreak })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      return NextResponse.json({
        success: true,
        idempotent: true,
        wattsEarned: existingSession.wattsEarned,
        wattsBalance: u?.wattsBalance ?? 0,
        newStreak: u?.studyStreak ?? 0,
      });
    }

    // Porta Jon Challenge is gated to once every 2h. Reject early so a counted
    // attempt isn't consumed during cooldown (the client also gates this via
    // GET /api/porta-jon/state, so this is a server-side safety net).
    if (activityType === PORTA_JON_ACTIVITY_TYPE) {
      const [u] = await db
        .select({ throneLastCompletedAt: users.throneLastCompletedAt })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      const remaining = portaJonCooldownRemaining(u?.throneLastCompletedAt ?? null);
      if (remaining > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Porta Jon Challenge is on cooldown.",
            cooldownRemainingMs: remaining,
          },
          { status: 429 },
        );
      }
    }

    // Award via the shared, idempotent path (same code the offline sync ingest
    // uses, so a session credits Watts exactly once across online + offline).
    const award = await awardSession({
      userId: session.user.id,
      sessionId,
      activityType,
      questionsAnswered: questionsAnswered ?? 0,
      questionsCorrect: questionsCorrect ?? 0,
    });

    return NextResponse.json({
      success: true,
      wattsEarned: award.wattsEarned,
      wattsBalance: award.wattsBalance,
      newStreak: award.newStreak,
      classification: award.classification,
      classificationTitle: award.classificationTitle,
      advancement: award.advancement,
      portaJon: award.portaJon,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
