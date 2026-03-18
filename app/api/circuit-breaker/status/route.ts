import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, circuitBreakerState } from "@/lib/db";
import { eq } from "drizzle-orm";
import { isCooldownExpired, getRemainingCooldown, RESET_COST } from "@/lib/circuit-breaker";
import { CATEGORIES } from "@/types/question";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all breaker states for this user
    const states = await db
      .select()
      .from(circuitBreakerState)
      .where(eq(circuitBreakerState.userId, userId));

    const stateMap = new Map(states.map((s: any) => [s.categorySlug, s]));

    // Build response for all categories
    const breakers = CATEGORIES.map((cat) => {
      const state = stateMap.get(cat.slug) as any;

      if (!state) {
        return {
          categorySlug: cat.slug,
          categoryName: cat.name,
          consecutiveWrong: 0,
          isTripped: false,
          cooldownRemaining: 0,
          totalAttempts: 0,
          totalTrips: 0,
          currentStreak: 0,
          bestStreak: 0,
          canReset: false,
          resetCost: RESET_COST,
        };
      }

      // Auto-resolve expired cooldowns
      const locked = state.isTripped && !isCooldownExpired(state.cooldownEndsAt);

      return {
        categorySlug: state.categorySlug,
        categoryName: cat.name,
        consecutiveWrong: locked ? state.consecutiveWrong : 0,
        isTripped: locked,
        cooldownRemaining: locked ? getRemainingCooldown(state.cooldownEndsAt) : 0,
        totalAttempts: state.totalAttempts,
        totalTrips: state.totalTrips,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        canReset: locked,
        resetCost: RESET_COST,
      };
    });

    // Count tripped breakers
    const trippedCount = breakers.filter((b) => b.isTripped).length;

    return NextResponse.json({
      breakers,
      trippedCount,
    });
  } catch (error) {
    console.error("Error fetching breaker status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
