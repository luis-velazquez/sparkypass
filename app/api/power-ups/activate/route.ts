import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, powerUpPurchases } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { purchaseId } = await request.json();
    const userId = session.user.id;

    if (!purchaseId) {
      return NextResponse.json({ error: "Purchase ID is required" }, { status: 400 });
    }

    // Find the purchase
    const [purchase] = await db
      .select()
      .from(powerUpPurchases)
      .where(
        and(
          eq(powerUpPurchases.id, purchaseId),
          eq(powerUpPurchases.userId, userId),
          isNull(powerUpPurchases.usedAt),
        ),
      )
      .limit(1);

    if (!purchase) {
      return NextResponse.json({ error: "Power-up not found or already used" }, { status: 404 });
    }

    if (purchase.isActive) {
      return NextResponse.json({ error: "Power-up is already active" }, { status: 400 });
    }

    const now = new Date();

    // Set expiry based on type
    let expiresAt: Date | null = null;
    if (purchase.powerUpType === "streak_fuse") {
      // 24 hours from activation
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Also set the user's streakFuseExpiresAt field
      await db
        .update(users)
        .set({ streakFuseExpiresAt: expiresAt, updatedAt: now })
        .where(eq(users.id, userId));
    } else if (purchase.powerUpType === "formula_sheet") {
      // Active until used (marked as used when quiz completes)
      // No expiry — consumed on next quiz
      expiresAt = null;
    } else if (purchase.powerUpType === "breaker_reset" || purchase.powerUpType === "sparky_tip") {
      // Instant use — mark as used immediately
      await db
        .update(powerUpPurchases)
        .set({ isActive: false, usedAt: now })
        .where(eq(powerUpPurchases.id, purchaseId));

      return NextResponse.json({
        success: true,
        type: purchase.powerUpType,
      });
    }

    // Activate the power-up
    await db
      .update(powerUpPurchases)
      .set({
        isActive: true,
        expiresAt,
      })
      .where(eq(powerUpPurchases.id, purchaseId));

    return NextResponse.json({
      success: true,
      type: purchase.powerUpType,
      expiresAt: expiresAt?.toISOString() || null,
      message: `${purchase.powerUpType === "streak_fuse" ? "Streak Fuse" : "Formula Sheet"} activated!`,
    });
  } catch (error) {
    console.error("Error activating power-up:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
