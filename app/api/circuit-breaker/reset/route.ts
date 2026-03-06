import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, circuitBreakerState, wattsTransactions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
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

    // Get user's current balance
    const [currentUser] = await db
      .select({
        wattsBalance: users.wattsBalance,
        level: users.level,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ((currentUser.wattsBalance || 0) < RESET_COST) {
      return NextResponse.json(
        { error: "Insufficient Watts", required: RESET_COST, balance: currentUser.wattsBalance },
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

    // Reset the breaker
    await db
      .update(circuitBreakerState)
      .set({
        isTripped: false,
        consecutiveWrong: 0,
        cooldownEndsAt: null,
      })
      .where(eq(circuitBreakerState.id, breakerState.id));

    // Deduct Watts
    const newBalance = (currentUser.wattsBalance || 0) - RESET_COST;
    await db
      .update(users)
      .set({
        wattsBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

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
