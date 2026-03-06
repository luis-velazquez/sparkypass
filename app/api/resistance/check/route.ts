import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, wattsTransactions, questionSrs } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { RESISTANCE_PENALTIES } from "@/lib/watts";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user] = await db
      .select({
        wattsBalance: users.wattsBalance,
        lastStudyDate: users.lastStudyDate,
        lastPenaltyDate: users.lastPenaltyDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const penalties: Array<{ type: string; amount: number; description: string }> = [];
    let totalDeducted = 0;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Already checked today — skip
    if (user.lastPenaltyDate && user.lastPenaltyDate >= todayStart) {
      return NextResponse.json({
        penalties: [],
        newBalance: user.wattsBalance,
      });
    }

    // Calculate missed days since max(lastPenaltyDate, lastStudyDate) or 0
    const referenceDate = (() => {
      if (user.lastPenaltyDate && user.lastStudyDate) {
        return user.lastPenaltyDate > user.lastStudyDate ? user.lastPenaltyDate : user.lastStudyDate;
      }
      return user.lastPenaltyDate || user.lastStudyDate || null;
    })();

    if (referenceDate) {
      const refDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
      const diffMs = todayStart.getTime() - refDay.getTime();
      const missedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Only penalize if more than 1 day gap (yesterday is fine if they studied)
      if (missedDays > 1) {
        const penaltyDays = missedDays - 1; // Don't count today
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

    // Check for overdue SRS reviews
    const [overdueResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(questionSrs)
      .where(
        sql`${questionSrs.userId} = ${userId} AND ${questionSrs.nextReviewDate} < ${Math.floor(todayStart.getTime() / 1000)}`
      );

    if (overdueResult && overdueResult.count > 0) {
      penalties.push({
        type: "resistance_missed_review",
        amount: -RESISTANCE_PENALTIES.missed_review,
        description: `${overdueResult.count} overdue review${overdueResult.count > 1 ? "s" : ""} not completed`,
      });
      totalDeducted += RESISTANCE_PENALTIES.missed_review;
    }

    // Apply penalties
    const newBalance = Math.max(0, user.wattsBalance - totalDeducted);

    if (totalDeducted > 0) {
      // Update user balance and penalty date
      await db
        .update(users)
        .set({
          wattsBalance: newBalance,
          lastPenaltyDate: now,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      // Log transactions
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
      // Just update penalty date so we don't re-check today
      await db
        .update(users)
        .set({ lastPenaltyDate: now, updatedAt: now })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      penalties,
      newBalance,
    });
  } catch (error) {
    console.error("Error checking resistance penalties:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
