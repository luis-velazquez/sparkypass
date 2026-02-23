import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, userProgress } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { getXPRewardsForDifficulty, getCoinRewardsForDifficulty, getLevelFromXP, checkLevelUp } from "@/lib/levels";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, isCorrect, timeSpentSeconds, difficulty, streakCoinBonus } = body;

    if (!questionId || typeof isCorrect !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: questionId and isCorrect" },
        { status: 400 }
      );
    }

    // Generate unique ID for progress entry
    const progressId = crypto.randomUUID();

    // Get current user XP and coins for level-up detection
    const [currentUser] = await db
      .select({ xp: users.xp, level: users.level, coins: users.coins })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const previousXP = currentUser?.xp || 0;

    // Insert progress record
    await db.insert(userProgress).values({
      id: progressId,
      userId: session.user.id,
      questionId,
      isCorrect,
      timeSpentSeconds: timeSpentSeconds || null,
      answeredAt: new Date(),
    });

    // If correct, award XP + coins and update user record
    let xpEarned = 0;
    let coinsEarned = 0;
    let levelUp = null;

    if (isCorrect) {
      xpEarned = getXPRewardsForDifficulty(difficulty).CORRECT_ANSWER;
      coinsEarned = getCoinRewardsForDifficulty(difficulty).CORRECT_ANSWER + (streakCoinBonus || 0);
      const newXP = previousXP + xpEarned;
      const newLevel = getLevelFromXP(newXP);

      // Check for level-up
      levelUp = checkLevelUp(previousXP, newXP);

      await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${xpEarned}`,
          coins: sql`${users.coins} + ${coinsEarned}`,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));
    }
    // Note: lastStudyDate and studyStreak are updated in /api/sessions when the session ends

    // Get updated user XP and coins
    const [updatedUser] = await db
      .select({ xp: users.xp, level: users.level, coins: users.coins })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      progressId,
      xpEarned,
      coinsEarned,
      previousXP,
      totalXp: updatedUser?.xp || 0,
      totalCoins: updatedUser?.coins || 0,
      level: updatedUser?.level || 1,
      levelUp,
    });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
