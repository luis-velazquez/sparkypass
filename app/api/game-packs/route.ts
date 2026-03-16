import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, gamePackPurchases, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { GAME_PACK_CATALOG, type GameId } from "@/lib/game-packs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's watts balance
    const [user] = await db
      .select({ wattsBalance: users.wattsBalance })
      .from(users)
      .where(eq(users.id, userId));

    // Get all purchases for this user
    const purchases = await db
      .select({ gameId: gamePackPurchases.gameId, packId: gamePackPurchases.packId })
      .from(gamePackPurchases)
      .where(eq(gamePackPurchases.userId, userId));

    // Build owned map: gameId -> packId[]
    const owned: Record<GameId, string[]> = {
      "index-sniper": ["free"],
      "translation-engine": ["free"],
      "formula-builder": ["free"],
    };

    for (const p of purchases) {
      const gameId = p.gameId as GameId;
      if (owned[gameId]) {
        owned[gameId].push(p.packId);
      }
    }

    return NextResponse.json({
      owned,
      catalog: GAME_PACK_CATALOG,
      wattsBalance: user?.wattsBalance ?? 0,
    });
  } catch (error) {
    console.error("Error fetching game packs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
