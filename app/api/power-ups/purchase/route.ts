import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, powerUpPurchases, wattsTransactions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getPowerUpCost, getPowerUpName, POWER_UP_DEFINITIONS } from "@/lib/power-ups";
import type { PowerUpTypeValue } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();
    const userId = session.user.id;

    // Validate power-up type
    if (!type || !POWER_UP_DEFINITIONS[type as PowerUpTypeValue]) {
      return NextResponse.json({ error: "Invalid power-up type" }, { status: 400 });
    }

    const powerUpType = type as PowerUpTypeValue;
    const cost = getPowerUpCost(powerUpType);
    const name = getPowerUpName(powerUpType);

    // Get user's current balance
    const [user] = await db
      .select({
        wattsBalance: users.wattsBalance,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.wattsBalance < cost) {
      return NextResponse.json(
        { error: `Not enough Watts. Need ${cost}W, have ${user?.wattsBalance || 0}W.` },
        { status: 400 },
      );
    }

    const newBalance = user.wattsBalance - cost;

    // Create the purchase
    const purchaseId = uuidv4();
    await db.insert(powerUpPurchases).values({
      id: purchaseId,
      userId,
      powerUpType,
      isActive: false,
    });

    // Deduct Watts
    await db
      .update(users)
      .set({ wattsBalance: newBalance, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Log transaction
    await db.insert(wattsTransactions).values({
      id: uuidv4(),
      userId,
      type: "power_up_purchase",
      amount: -cost,
      balanceAfter: newBalance,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: `Purchased ${name}`,
    });

    // Dispatch watts-updated event via response
    return NextResponse.json({
      success: true,
      purchaseId,
      powerUpType,
      wattsSpent: cost,
      wattsBalance: newBalance,
    });
  } catch (error) {
    console.error("Error purchasing power-up:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
