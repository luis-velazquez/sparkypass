// Shared session-award path. Computes Watts + streak, ends the session, updates
// the balance, and writes the ledger — IDEMPOTENTLY. Called by BOTH the online
// PATCH /api/sessions and the offline sync ingest (handleSessionEnd), so an
// offline session credits Watts exactly once instead of being stuck at 0.
// (Audit: docs/mobile-conversion-plan.md §8 durable-outbox reframe.)

import { db, users, studySessions, wattsTransactions } from "@/lib/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import crypto from "crypto";
import { getStreakMilestoneReward, calculateWattsServerSide } from "@/lib/watts";
import { isStreakSkipAvailable } from "@/lib/streak";
import {
  getUserClassification,
  getClassificationTitle,
  checkClassificationAdvancement,
} from "@/lib/voltage";
import {
  PORTA_JON_ACTIVITY_TYPE,
  PORTA_JON_QUESTION_COUNT,
  PORTA_JON_ROYAL_FLUSH_BONUS,
  getPortaJonTitle,
} from "@/lib/porta-jon";
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
  // Porta Jon Challenge extras — only populated when activityType === 'porta_jon'.
  portaJon?: {
    throneStreak: number;
    throneStreakBest: number;
    scrollsDodged: number;
    title: string;
    royalFlush: boolean;
    longestStreak: number; // all-time best consecutive-correct streak
  };
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
      streakSkipUsedAt: users.streakSkipUsedAt,
      throneStreak: users.throneStreak,
      throneStreakBest: users.throneStreakBest,
      throneLastCompletedAt: users.throneLastCompletedAt,
      scrollsDodged: users.scrollsDodged,
      portaJonLongestStreak: users.portaJonLongestStreak,
    })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  if (!currentUser) {
    throw new Error(`awardSession: user ${input.userId} not found`);
  }

  // Streak relative to `at` (the play day) — so a synced-late session is dated as
  // of when it was played, not when it reached the server.
  const DAY_MS = 24 * 60 * 60 * 1000;
  const atDay = dayString(at);
  const yesterdayDay = dayString(new Date(at.getTime() - DAY_MS));
  const twoDaysAgoDay = dayString(new Date(at.getTime() - 2 * DAY_MS));
  const lastStudyDay = currentUser.lastStudyDate
    ? dayString(new Date(currentUser.lastStudyDate))
    : null;
  // Free automatic weekly grace: one missed day is forgiven, at most once per
  // rolling 7 days (replaces the paid Streak Fuse). Only bridges a SINGLE missed
  // day — a 2+ day gap always resets.
  const graceAvailable = isStreakSkipAvailable(currentUser.streakSkipUsedAt, at);

  // Only (re)compute the streak for a session on the NEWEST study day so far. A
  // same-day repeat OR a late/out-of-order offline session (at <= last study day)
  // leaves the streak untouched: no reset, no backward roll of lastStudyDate, no
  // milestone re-award. Watts are still awarded (idempotent per session).
  const advancesDay = lastStudyDay === null || atDay > lastStudyDay;

  let newStreak = currentUser.studyStreak || 0;
  let streakAdvanced = false;
  let graceUsed = false;
  if (advancesDay) {
    streakAdvanced = true;
    if (lastStudyDay === null) {
      newStreak = 1; // first ever session
    } else if (lastStudyDay === yesterdayDay) {
      newStreak = (currentUser.studyStreak || 0) + 1; // consecutive day
    } else if (lastStudyDay === twoDaysAgoDay && graceAvailable) {
      newStreak = (currentUser.studyStreak || 0) + 1; // one missed day, forgiven
      graceUsed = true;
    } else {
      newStreak = 1; // 2+ days missed, or the weekly skip is already spent → reset
    }
  }
  const newBestStreak = Math.max(newStreak, currentUser.bestStudyStreak || 0);
  // Milestone bonus only when the streak actually moved to a new day — never on a
  // same-day repeat — so a milestone (e.g. +800W at 30 days) can't be farmed by
  // replaying quizzes on the same day.
  const streakBonus = streakAdvanced ? getStreakMilestoneReward(newStreak) || 0 : 0;

  // ─ Porta Jon Challenge: throne streak (daily), scrolls-dodged, Royal Flush ─
  // The 2h cooldown is gated by the caller (PATCH /api/sessions); the per-session
  // atomic claim below still guarantees a given challenge advances throne once.
  const isPortaJon = input.activityType === PORTA_JON_ACTIVITY_TYPE;
  const royalFlush =
    isPortaJon &&
    input.questionsAnswered >= PORTA_JON_QUESTION_COUNT &&
    input.questionsCorrect >= PORTA_JON_QUESTION_COUNT;
  const royalFlushBonus = royalFlush ? PORTA_JON_ROYAL_FLUSH_BONUS : 0;

  let newThroneStreak = currentUser.throneStreak || 0;
  let newThroneBest = currentUser.throneStreakBest || 0;
  let newScrollsDodged = currentUser.scrollsDodged || 0;
  // Endless-run personal best. In the survival run the client only answers
  // correctly until the run-ending miss, so questionsCorrect IS the run's
  // consecutive-correct streak — no separate field needed.
  let newPortaJonLongest = currentUser.portaJonLongestStreak || 0;
  if (isPortaJon) {
    newThroneStreak = 1;
    if (currentUser.throneLastCompletedAt) {
      const lastThrone = dayString(new Date(currentUser.throneLastCompletedAt));
      if (lastThrone === yesterdayDay) newThroneStreak = (currentUser.throneStreak || 0) + 1;
      else if (lastThrone === atDay) newThroneStreak = currentUser.throneStreak || 1;
    }
    newThroneBest = Math.max(newThroneStreak, currentUser.throneStreakBest || 0);
    newScrollsDodged = (currentUser.scrollsDodged || 0) + 1;
    newPortaJonLongest = Math.max(currentUser.portaJonLongestStreak || 0, input.questionsCorrect || 0);
  }

  const totalWattsEarned = wattsEarned + royalFlushBonus + streakBonus;
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
      portaJon: isPortaJon
        ? {
            throneStreak: currentUser.throneStreak || 0,
            throneStreakBest: currentUser.throneStreakBest || 0,
            scrollsDodged: currentUser.scrollsDodged || 0,
            title: getPortaJonTitle(currentUser.scrollsDodged || 0).title,
            royalFlush: false,
            longestStreak: currentUser.portaJonLongestStreak || 0,
          }
        : undefined,
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
      // Never roll lastStudyDate backward: a late/out-of-order session keeps the
      // existing (newer) date so it can't corrupt future streak day-math.
      lastStudyDate: advancesDay ? at : currentUser.lastStudyDate,
      // Consume the weekly free skip only when it actually saved the streak.
      ...(graceUsed ? { streakSkipUsedAt: at } : {}),
      updatedAt: new Date(),
      // A Porta Jon run also advances its own throne streak + scrolls-dodged.
      ...(isPortaJon
        ? {
            throneStreak: newThroneStreak,
            throneStreakBest: newThroneBest,
            throneLastCompletedAt: at,
            scrollsDodged: newScrollsDodged,
            portaJonLongestStreak: newPortaJonLongest,
          }
        : {}),
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
      // Royal Flush bonus is folded into the main porta_jon entry (not a separate row).
      type: input.activityType,
      amount: wattsEarned + royalFlushBonus,
      balanceAfter: newBalance - streakBonus,
      sourceSessionId: input.sessionId,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: `${input.activityType} (${input.questionsCorrect}/${input.questionsAnswered} correct)${royalFlush ? " — Royal Flush!" : ""}`,
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
    portaJon: isPortaJon
      ? {
          throneStreak: newThroneStreak,
          throneStreakBest: newThroneBest,
          scrollsDodged: newScrollsDodged,
          title: getPortaJonTitle(newScrollsDodged).title,
          royalFlush,
          longestStreak: newPortaJonLongest,
        }
      : undefined,
  };
}
