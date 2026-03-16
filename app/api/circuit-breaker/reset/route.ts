import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, circuitBreakerState, wattsTransactions } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import { RESET_COST, isCooldownExpired } from "@/lib/circuit-breaker";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { categorySlug } = body;

    if (!categorySlug) {
      return NextResponse.json(
        { error: "categorySlug is required" },
        { status: 400 }
      );
    }

    // Get the breaker state
    const [breakerState] = await db
      .select()
      .from(circuitBreakerState)
      .where(
        and(
          eq(circuitBreakerState.userId, userId),
          eq(circuitBreakerState.categorySlug, categorySlug)
        )
      )
      .limit(1);

    if (!breakerState) {
      return NextResponse.json(
        { error: "No breaker state found for this category" },
        { status: 404 }
      );
    }

    // Check if breaker is actually tripped and cooldown hasn't expired
    if (!breakerState.isTripped || isCooldownExpired(breakerState.cooldownEndsAt)) {
      return NextResponse.json(
        { error: "Breaker is not currently tripped" },
        { status: 400 }
      );
    }

    // Atomic deduction — checks sufficient balance and deducts in one query
    const result = await db
      .update(users)
      .set({
        wattsBalance: sql`${users.wattsBalance} - ${RESET_COST}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.wattsBalance} >= ${RESET_COST}`
        )
      )
      .returning({ wattsBalance: users.wattsBalance });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Insufficient Watts", required: RESET_COST },
        { status: 400 }
      );
    }

    const newBalance = result[0].wattsBalance;

    // Reset the breaker
    await db
      .update(circuitBreakerState)
      .set({
        isTripped: false,
        consecutiveWrong: 0,
        cooldownEndsAt: null,
      })
      .where(eq(circuitBreakerState.id, breakerState.id));

    // Log transaction
    await db.insert(wattsTransactions).values({
      id: crypto.randomUUID(),
      userId,
      type: "power_up_purchase",
      amount: -RESET_COST,
      balanceAfter: newBalance,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: `Breaker Reset: ${categorySlug}`,
    });

    // Notify frontend
    return NextResponse.json({
      success: true,
      wattsSpent: RESET_COST,
      wattsBalance: newBalance,
      categorySlug,
    });
  } catch (error) {
    console.error("Error resetting breaker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
