import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, gamePackPurchases, wattsTransactions } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getPackCost, getPackMeta, type GameId } from "@/lib/game-packs";
import { gameIdValues } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId, packId } = await request.json();
    const userId = session.user.id;

    // Validate gameId
    if (!gameId || !gameIdValues.includes(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    // Validate pack exists in catalog
    const cost = getPackCost(gameId as GameId, packId);
    if (cost === null) {
      return NextResponse.json({ error: "Invalid pack ID" }, { status: 400 });
    }

    const meta = getPackMeta(gameId as GameId, packId)!;

    // Check not already owned
    const existing = await db
      .select({ id: gamePackPurchases.id })
      .from(gamePackPurchases)
      .where(
        and(
          eq(gamePackPurchases.userId, userId),
          eq(gamePackPurchases.gameId, gameId),
          eq(gamePackPurchases.packId, packId),
        )
      );

    if (existing.length > 0) {
      return NextResponse.json({ error: "Pack already owned" }, { status: 400 });
    }

    // Atomic deduction — checks sufficient balance and deducts in one query
    const result = await db
      .update(users)
      .set({
        wattsBalance: sql`${users.wattsBalance} - ${cost}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.wattsBalance} >= ${cost}`
        )
      )
      .returning({ wattsBalance: users.wattsBalance });

    if (result.length === 0) {
      return NextResponse.json(
        { error: `Not enough Watts. Need ${cost}W.` },
        { status: 400 },
      );
    }

    const newBalance = result[0].wattsBalance;

    // Create the purchase
    await db.insert(gamePackPurchases).values({
      id: uuidv4(),
      userId,
      gameId,
      packId,
      cost,
    });

    // Log transaction
    await db.insert(wattsTransactions).values({
      id: uuidv4(),
      userId,
      type: "game_pack_purchase",
      amount: -cost,
      balanceAfter: newBalance,
      voltageAtTime: 0,
      ampsAtTime: 0,
      description: `Purchased ${meta.name} for ${gameId}`,
    });

    return NextResponse.json({
      success: true,
      wattsBalance: newBalance,
      gameId,
      packId,
      wattsSpent: cost,
    });
  } catch (error) {
    console.error("Error purchasing game pack:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
