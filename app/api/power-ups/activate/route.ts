import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, powerUpPurchases } from "@/lib/db";
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

    // breaker_reset / sparky_tip are instant — mark used and return immediately.
    if (
      purchase.powerUpType === "breaker_reset" ||
      purchase.powerUpType === "sparky_tip"
    ) {
      await db
        .update(powerUpPurchases)
        .set({ isActive: false, usedAt: now })
        .where(eq(powerUpPurchases.id, purchaseId));

      return NextResponse.json({
        success: true,
        type: purchase.powerUpType,
      });
    }

    // formula_sheet: active until consumed on the next quiz (no expiry).
    await db
      .update(powerUpPurchases)
      .set({ isActive: true, expiresAt: null })
      .where(eq(powerUpPurchases.id, purchaseId));

    return NextResponse.json({
      success: true,
      type: purchase.powerUpType,
      expiresAt: null,
      message: "Formula Sheet activated!",
    });
  } catch (error) {
    console.error("Error activating power-up:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
