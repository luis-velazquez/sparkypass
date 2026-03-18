import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, wattsTransactions } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const CONTINUE_COST = 1000;

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Atomic deduction — checks sufficient balance and deducts in one query
    const result = await db
      .update(users)
      .set({
        wattsBalance: sql`${users.wattsBalance} - ${CONTINUE_COST}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.wattsBalance} >= ${CONTINUE_COST}`
        )
      )
      .returning({ wattsBalance: users.wattsBalance });

    if (result.length === 0) {
      return NextResponse.json(
        { error: `Not enough Watts. Need ${CONTINUE_COST}W.` },
        { status: 400 },
      );
    }

    const newBalance = result[0].wattsBalance;

    // Log transaction
    await db.insert(wattsTransactions).values({
      id: uuidv4(),
      userId,
      type: "game_continue",
      amount: -CONTINUE_COST,
      balanceAfter: newBalance,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: "Game continue — reset strikes",
    });

    return NextResponse.json({
      success: true,
      wattsSpent: CONTINUE_COST,
      wattsBalance: newBalance,
    });
  } catch (error) {
    console.error("Error processing game continue:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
