import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, studySessions, wattsTransactions } from "@/lib/db";
import { eq, and, sql, count, isNotNull } from "drizzle-orm";
import crypto from "crypto";
import { getStreakMilestoneReward, calculateWattsServerSide } from "@/lib/watts";
import { getUserClassification, getClassificationTitle, checkClassificationAdvancement } from "@/lib/voltage";
import { trackEvent } from "@/lib/analytics";

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

    // Server-side watts calculation — ignore any client-provided wattsEarned
    const wattsEarned = calculateWattsServerSide(activityType, questionsCorrect ?? 0, questionsAnswered ?? 0);

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

    // Get current user state
    const [currentUser] = await db
      .select({
        wattsBalance: users.wattsBalance,
        wattsLifetime: users.wattsLifetime,
        studyStreak: users.studyStreak,
        bestStudyStreak: users.bestStudyStreak,
        lastStudyDate: users.lastStudyDate,
        streakFuseExpiresAt: users.streakFuseExpiresAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Calculate study streak using UTC date strings
    const todayUTC = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayUTC = yesterdayDate.toISOString().slice(0, 10);

    const streakFuseActive = currentUser?.streakFuseExpiresAt && currentUser.streakFuseExpiresAt > new Date();

    let newStreak = 1;
    if (currentUser?.lastStudyDate) {
      const lastStudyUTC = new Date(currentUser.lastStudyDate).toISOString().slice(0, 10);
      if (lastStudyUTC === yesterdayUTC) {
        newStreak = (currentUser.studyStreak || 0) + 1;
      } else if (lastStudyUTC === todayUTC) {
        newStreak = currentUser.studyStreak || 1;
      } else if (streakFuseActive) {
        newStreak = (currentUser.studyStreak || 0) + 1;
      }
    }

    const newBestStreak = Math.max(newStreak, currentUser?.bestStudyStreak || 0);

    // Check for streak milestone bonus
    const streakBonus = getStreakMilestoneReward(newStreak) || 0;
    const totalWattsEarned = wattsEarned + streakBonus;

    const previousBalance = currentUser?.wattsBalance || 0;

    // Update the session
    await db
      .update(studySessions)
      .set({
        endedAt: new Date(),
        wattsEarned: totalWattsEarned,
        questionsAnswered: questionsAnswered ?? null,
        questionsCorrect: questionsCorrect ?? null,
      })
      .where(
        and(
          eq(studySessions.id, sessionId),
          eq(studySessions.userId, session.user.id)
        )
      );

    // Atomic balance update — prevents lost updates from concurrent requests
    const [updatedUser] = await db
      .update(users)
      .set({
        wattsBalance: sql`${users.wattsBalance} + ${totalWattsEarned}`,
        wattsLifetime: sql`${users.wattsLifetime} + ${totalWattsEarned}`,
        xp: sql`${users.wattsLifetime} + ${totalWattsEarned}`,
        studyStreak: newStreak,
        bestStudyStreak: newBestStreak,
        lastStudyDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning({ wattsBalance: users.wattsBalance, wattsLifetime: users.wattsLifetime });

    const newBalance = updatedUser.wattsBalance;

    // Log activity watts transaction
    await db.insert(wattsTransactions).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      type: activityType,
      amount: wattsEarned,
      balanceAfter: newBalance - streakBonus,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: `${activityType} (${questionsCorrect ?? 0}/${questionsAnswered ?? 0} correct)`,
    });

    // Log streak milestone bonus if applicable
    if (streakBonus > 0) {
      await db.insert(wattsTransactions).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        type: "streak_milestone",
        amount: streakBonus,
        balanceAfter: newBalance,
        voltageAtTime: 0,
        ampsAtTime: 0,
        description: `${newStreak}-day streak milestone!`,
      });
    }

    // Check for classification advancement
    const advancement = checkClassificationAdvancement(previousBalance, newBalance);

    const classification = getUserClassification(newBalance).classification;
    const classificationTitle = getClassificationTitle(newBalance);

    console.log(`Session complete for user ${session.user.id}: +${totalWattsEarned}W, streak=${newStreak}`);

    // ── Analytics (Phase 3) ── Emitted ONLY on this non-idempotent path; the
    // early return at the top handles retries, so these never double-count.
    const previousLifetime = currentUser?.wattsLifetime || 0;
    const newLifetime = updatedUser.wattsLifetime;
    const accuracy =
      questionsAnswered && questionsAnswered > 0
        ? Math.round(((questionsCorrect ?? 0) / questionsAnswered) * 100)
        : null;
    const [{ value: endedCount } = { value: 0 }] = await db
      .select({ value: count() })
      .from(studySessions)
      .where(and(eq(studySessions.userId, session.user.id), isNotNull(studySessions.endedAt)));

    const emits: Promise<void>[] = [
      trackEvent({
        event: "study_session_completed",
        userId: session.user.id,
        properties: { session_type: activityType, questions_answered: questionsAnswered ?? 0, accuracy, watts_earned: totalWattsEarned },
      }),
    ];
    if (activityType === "daily_challenge") {
      emits.push(trackEvent({
        event: "daily_challenge_completed",
        userId: session.user.id,
        properties: { questions_correct: questionsCorrect ?? 0, questions_answered: questionsAnswered ?? 0, watts_earned: totalWattsEarned, perfect: accuracy === 100 },
      }));
    }
    if (newStreak > (currentUser?.studyStreak || 0)) {
      emits.push(trackEvent({
        event: "streak_extended",
        userId: session.user.id,
        properties: { new_streak: newStreak, best_streak: newBestStreak, is_milestone: streakBonus > 0, used_streak_fuse: !!streakFuseActive },
      }));
    }
    if (endedCount === 1) {
      emits.push(trackEvent({
        event: "first_quiz_completed",
        userId: session.user.id,
        properties: { session_type: activityType, questions_answered: questionsAnswered ?? 0, accuracy },
      }));
    }
    if (previousLifetime === 0 && totalWattsEarned > 0) {
      emits.push(trackEvent({
        event: "first_watts_earned",
        userId: session.user.id,
        properties: { watts_amount: totalWattsEarned, source: activityType },
      }));
    }
    if (advancement) {
      emits.push(trackEvent({
        event: "rank_advanced",
        userId: session.user.id,
        properties: { to_classification: advancement.newTitle, watts_lifetime: newLifetime },
      }));
    }
    await Promise.all(emits);

    return NextResponse.json({
      success: true,
      wattsEarned: totalWattsEarned,
      wattsBalance: newBalance,
      newStreak,
      classification,
      classificationTitle,
      advancement,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
