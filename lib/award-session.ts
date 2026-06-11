// Shared session-award path. Computes Watts + streak, ends the session, updates
// the balance, and writes the ledger — IDEMPOTENTLY. Called by BOTH the online
// PATCH /api/sessions and the offline sync ingest (handleSessionEnd), so an
// offline session credits Watts exactly once instead of being stuck at 0.
// (Audit: docs/mobile-conversion-plan.md §8 durable-outbox reframe.)

import { db, users, studySessions, wattsTransactions } from "@/lib/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import crypto from "crypto";
import { getStreakMilestoneReward, calculateWattsServerSide } from "@/lib/watts";
import {
  getUserClassification,
  getClassificationTitle,
  checkClassificationAdvancement,
} from "@/lib/voltage";
import type { UserClassification } from "@/types/reward-system";

export interface AwardSessionInput {
  userId: string;
  sessionId: string;
  activityType: string;
  questionsAnswered: number;
  questionsCorrect: number;
  /** When the session ended (play time). Defaults to now; used for the streak date. */
  at?: Date;
}

export interface AwardSessionResult {
  awarded: boolean; // false = idempotent skip (already ended/awarded)
  wattsEarned: number;
  wattsBalance: number;
  newStreak: number;
  classification: UserClassification;
  classificationTitle: string;
  advancement: { newClassification: UserClassification; newTitle: string } | null;
}

function dayString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function awardSession(
  input: AwardSessionInput,
): Promise<AwardSessionResult> {
  const at = input.at ?? new Date();
  const wattsEarned = calculateWattsServerSide(
    input.activityType,
    input.questionsCorrect,
    input.questionsAnswered,
  );

  const [currentUser] = await db
    .select({
      wattsBalance: users.wattsBalance,
      studyStreak: users.studyStreak,
      bestStudyStreak: users.bestStudyStreak,
      lastStudyDate: users.lastStudyDate,
      streakFuseExpiresAt: users.streakFuseExpiresAt,
    })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  if (!currentUser) {
    throw new Error(`awardSession: user ${input.userId} not found`);
  }

  // Streak relative to `at` (the play day) — so a synced-late session is dated as
  // of when it was played, not when it reached the server.
  const atDay = dayString(at);
  const yesterdayDay = dayString(new Date(at.getTime() - 24 * 60 * 60 * 1000));
  const fuseActive =
    !!currentUser.streakFuseExpiresAt &&
    currentUser.streakFuseExpiresAt > new Date();

  let newStreak = 1;
  if (currentUser.lastStudyDate) {
    const last = dayString(new Date(currentUser.lastStudyDate));
    if (last === yesterdayDay) newStreak = (currentUser.studyStreak || 0) + 1;
    else if (last === atDay) newStreak = currentUser.studyStreak || 1;
    else if (fuseActive) newStreak = (currentUser.studyStreak || 0) + 1;
  }
  const newBestStreak = Math.max(newStreak, currentUser.bestStudyStreak || 0);
  const streakBonus = getStreakMilestoneReward(newStreak) || 0;
  const totalWattsEarned = wattsEarned + streakBonus;
  const previousBalance = currentUser.wattsBalance || 0;

  // Atomic claim: end the session only if it isn't already ended. If the other
  // path (online PATCH vs offline sync) ended it first, this updates 0 rows and
  // we skip the award — no double-credit. This is the idempotency gate.
  const claimed = await db
    .update(studySessions)
    .set({
      endedAt: at,
      wattsEarned: totalWattsEarned,
      questionsAnswered: input.questionsAnswered,
      questionsCorrect: input.questionsCorrect,
    })
    .where(
      and(
        eq(studySessions.id, input.sessionId),
        eq(studySessions.userId, input.userId),
        isNull(studySessions.endedAt),
      ),
    )
    .returning({ id: studySessions.id });

  if (claimed.length === 0) {
    const current = getUserClassification(previousBalance);
    return {
      awarded: false,
      wattsEarned: 0,
      wattsBalance: previousBalance,
      newStreak: currentUser.studyStreak || 0,
      classification: current.classification,
      classificationTitle: current.title,
      advancement: null,
    };
  }

  const [updated] = await db
    .update(users)
    .set({
      wattsBalance: sql`${users.wattsBalance} + ${totalWattsEarned}`,
      wattsLifetime: sql`${users.wattsLifetime} + ${totalWattsEarned}`,
      xp: sql`${users.wattsLifetime} + ${totalWattsEarned}`,
      studyStreak: newStreak,
      bestStudyStreak: newBestStreak,
      lastStudyDate: at,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId))
    .returning({ wattsBalance: users.wattsBalance });

  const newBalance = updated.wattsBalance;

  // Ledger — idempotent on (user_id, source_session_id) belt-and-suspenders.
  await db
    .insert(wattsTransactions)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      type: input.activityType,
      amount: wattsEarned,
      balanceAfter: newBalance - streakBonus,
      sourceSessionId: input.sessionId,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: `${input.activityType} (${input.questionsCorrect}/${input.questionsAnswered} correct)`,
    })
    .onConflictDoNothing();

  if (streakBonus > 0) {
    await db
      .insert(wattsTransactions)
      .values({
        id: crypto.randomUUID(),
        userId: input.userId,
        type: "streak_milestone",
        amount: streakBonus,
        balanceAfter: newBalance,
        sourceSessionId: `${input.sessionId}:streak`,
        voltageAtTime: 0,
        ampsAtTime: 0,
        description: `${newStreak}-day streak milestone!`,
      })
      .onConflictDoNothing();
  }

  const advancement = checkClassificationAdvancement(previousBalance, newBalance);
  const classification = getUserClassification(newBalance);

  return {
    awarded: true,
    wattsEarned: totalWattsEarned,
    wattsBalance: newBalance,
    newStreak,
    classification: classification.classification,
    classificationTitle: classification.title,
    advancement,
  };
}
