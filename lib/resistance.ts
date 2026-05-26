// Shared resistance-penalty logic. Used by /api/resistance/check (on-demand,
// from the web dashboard) AND /api/cron/resistance (server-driven, hourly, at
// user-local 3am per OQ#4 resolution).
//
// Penalties:
//   - "no_login" — for each day of inactivity beyond yesterday
//   - "missed_review" — flat per-user if any SRS rows are overdue
//
// Idempotency: writes lastPenaltyDate. A second call on the same day is a
// no-op (matches the existing /api/resistance/check behavior).

import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { db, users, wattsTransactions, questionSrs } from "@/lib/db";
import { RESISTANCE_PENALTIES } from "@/lib/watts";

export interface ResistancePenalty {
  type: string;
  amount: number;          // negative integer
  description: string;
}

export interface ResistanceResult {
  applied: boolean;        // did we actually deduct anything this call?
  penalties: ResistancePenalty[];
  newBalance: number;
  alreadyCheckedToday: boolean;
}

/**
 * Apply resistance penalties for a single user. Computes against the server's
 * UTC clock — for the cron, the caller is expected to have already filtered
 * users by "now is 3am in their timezone." For on-demand calls, the server-day
 * boundary is a fine approximation.
 *
 * Returns the result so callers can log / respond. Internally idempotent:
 * applies at most once per day per user.
 */
export async function applyResistanceForUser(
  userId: string,
): Promise<ResistanceResult | null> {
  const [user] = await db
    .select({
      wattsBalance: users.wattsBalance,
      lastStudyDate: users.lastStudyDate,
      lastPenaltyDate: users.lastPenaltyDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Already checked today — skip.
  if (user.lastPenaltyDate && user.lastPenaltyDate >= todayStart) {
    return {
      applied: false,
      penalties: [],
      newBalance: user.wattsBalance,
      alreadyCheckedToday: true,
    };
  }

  const penalties: ResistancePenalty[] = [];
  let totalDeducted = 0;

  // Missed-day penalty: count whole days since max(lastPenalty, lastStudy).
  const referenceDate = (() => {
    if (user.lastPenaltyDate && user.lastStudyDate) {
      return user.lastPenaltyDate > user.lastStudyDate ? user.lastPenaltyDate : user.lastStudyDate;
    }
    return user.lastPenaltyDate || user.lastStudyDate || null;
  })();

  if (referenceDate) {
    const refDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );
    const missedDays = Math.floor(
      (todayStart.getTime() - refDay.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (missedDays > 1) {
      const penaltyDays = missedDays - 1;  // yesterday doesn't count
      const amount = penaltyDays * RESISTANCE_PENALTIES.no_login;
      if (amount > 0) {
        penalties.push({
          type: "resistance_no_login",
          amount: -amount,
          description: `${penaltyDays} missed day${penaltyDays > 1 ? "s" : ""} (-${RESISTANCE_PENALTIES.no_login}W each)`,
        });
        totalDeducted += amount;
      }
    }
  }

  // Overdue SRS penalty: flat once-per-day if any reviews are past due.
  const [overdueResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(questionSrs)
    .where(
      sql`${questionSrs.userId} = ${userId} AND ${questionSrs.nextReviewDate} < ${Math.floor(todayStart.getTime() / 1000)}`,
    );

  if (overdueResult && Number(overdueResult.count) > 0) {
    penalties.push({
      type: "resistance_missed_review",
      amount: -RESISTANCE_PENALTIES.missed_review,
      description: `${overdueResult.count} overdue review${Number(overdueResult.count) > 1 ? "s" : ""} not completed`,
    });
    totalDeducted += RESISTANCE_PENALTIES.missed_review;
  }

  const newBalance = Math.max(0, user.wattsBalance - totalDeducted);

  if (totalDeducted > 0) {
    await db
      .update(users)
      .set({
        wattsBalance: newBalance,
        lastPenaltyDate: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    for (const penalty of penalties) {
      await db.insert(wattsTransactions).values({
        id: crypto.randomUUID(),
        userId,
        type: penalty.type,
        amount: penalty.amount,
        balanceAfter: newBalance,
        voltageAtTime: 0,
        ampsAtTime: 0,
        description: penalty.description,
      });
    }
  } else {
    // No penalty this round but mark as checked so the cron+dashboard don't
    // re-evaluate today.
    await db
      .update(users)
      .set({ lastPenaltyDate: now, updatedAt: now })
      .where(eq(users.id, userId));
  }

  return {
    applied: totalDeducted > 0,
    penalties,
    newBalance,
    alreadyCheckedToday: false,
  };
}
