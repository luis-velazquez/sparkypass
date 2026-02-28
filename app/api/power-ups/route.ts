import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, powerUpPurchases } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";
import { POWER_UP_LIST } from "@/lib/power-ups";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's Watts balance
    const [user] = await db
      .select({ wattsBalance: users.wattsBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Get user's purchased power-ups (unused)
    const purchased = await db
      .select()
      .from(powerUpPurchases)
      .where(
        and(
          eq(powerUpPurchases.userId, userId),
          isNull(powerUpPurchases.usedAt),
        ),
      );

    // Filter out expired ones and separate active vs inventory
    const now = new Date();
    const active = purchased.filter(
      (p) => p.isActive && (!p.expiresAt || p.expiresAt > now),
    );
    const inventory = purchased.filter(
      (p) => !p.isActive && (!p.expiresAt || p.expiresAt > now),
    );

    return NextResponse.json({
      available: POWER_UP_LIST,
      active: active.map((p) => ({
        id: p.id,
        type: p.powerUpType,
        purchasedAt: p.purchasedAt?.toISOString() || null,
        expiresAt: p.expiresAt?.toISOString() || null,
      })),
      inventory: inventory.map((p) => ({
        id: p.id,
        type: p.powerUpType,
        purchasedAt: p.purchasedAt?.toISOString() || null,
      })),
      wattsBalance: user?.wattsBalance || 0,
    });
  } catch (error) {
    console.error("Error fetching power-ups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
