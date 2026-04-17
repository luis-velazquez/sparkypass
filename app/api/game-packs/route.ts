import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, gamePackPurchases, gameMasteryState, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { GAME_PACK_CATALOG, type GameId } from "@/lib/game-packs";
import { SNIPER_PACKS } from "@/app/(games)/index-sniper/sniper-data";
import { TRANSLATION_PACKS } from "@/app/(games)/translation-engine/translation-data";
import { MASTERY_STREAK_THRESHOLD } from "@/app/(games)/shared";

/** Ordered pack IDs for mastery games */
const MASTERY_PACK_IDS: Record<string, string[]> = {
  "index-sniper": SNIPER_PACKS.map((p) => p.id),
  "translation-engine": TRANSLATION_PACKS.map((p) => p.id),
};

/** Given legacy purchases, find the highest pack position index */
function highestPurchasedIndex(packOrder: string[], purchasedIds: string[]): number {
  let max = 0;
  for (const id of purchasedIds) {
    const idx = packOrder.indexOf(id);
    if (idx > max) max = idx;
  }
  return max;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parallel fetches
    const [userRows, purchases, masteryRows] = await Promise.all([
      db.select({ wattsBalance: users.wattsBalance }).from(users).where(eq(users.id, userId)),
      db.select({ gameId: gamePackPurchases.gameId, packId: gamePackPurchases.packId }).from(gamePackPurchases).where(eq(gamePackPurchases.userId, userId)),
      db.select().from(gameMasteryState).where(eq(gameMasteryState.userId, userId)),
    ]);

    const wattsBalance = userRows[0]?.wattsBalance ?? 0;

    // Build legacy purchase map
    const purchaseMap: Record<string, string[]> = {};
    for (const p of purchases) {
      (purchaseMap[p.gameId] ??= []).push(p.packId);
    }

    // Build mastery map
    const masteryMap: Record<string, { unlockedPackIndex: number; bestStreak: number }> = {};
    for (const m of masteryRows) {
      masteryMap[m.gameId] = { unlockedPackIndex: m.unlockedPackIndex, bestStreak: m.bestStreak };
    }

    // Build owned map — mastery-based for Index Sniper & Translation Engine, purchase-based for Formula Builder
    const owned: Record<GameId, string[]> = {
      "index-sniper": ["free"],
      "translation-engine": ["free"],
      "formula-builder": ["free"],
    };

    // Formula Builder: keep purchase-based
    for (const id of (purchaseMap["formula-builder"] ?? [])) {
      owned["formula-builder"].push(id);
    }

    // Mastery games: merge mastery index with legacy purchases
    for (const gameId of ["index-sniper", "translation-engine"] as const) {
      const packOrder = MASTERY_PACK_IDS[gameId];
      const masteryIndex = masteryMap[gameId]?.unlockedPackIndex ?? 0;
      const legacyIndex = highestPurchasedIndex(packOrder, purchaseMap[gameId] ?? []);
      const effectiveIndex = Math.max(masteryIndex, legacyIndex);

      // All packs from 0 through effectiveIndex are unlocked
      owned[gameId] = packOrder.slice(0, effectiveIndex + 1);
    }

    // Build mastery progress info for the client
    const mastery: Record<string, { unlockedIndex: number; totalPacks: number; bestStreak: number; threshold: number }> = {};
    for (const gameId of ["index-sniper", "translation-engine"] as const) {
      const packOrder = MASTERY_PACK_IDS[gameId];
      const m = masteryMap[gameId];
      const legacyIndex = highestPurchasedIndex(packOrder, purchaseMap[gameId] ?? []);
      const effectiveIndex = Math.max(m?.unlockedPackIndex ?? 0, legacyIndex);
      mastery[gameId] = {
        unlockedIndex: effectiveIndex,
        totalPacks: packOrder.length,
        bestStreak: m?.bestStreak ?? 0,
        threshold: MASTERY_STREAK_THRESHOLD,
      };
    }

    return NextResponse.json({
      owned,
      catalog: GAME_PACK_CATALOG,
      wattsBalance,
      mastery,
    });
  } catch (error) {
    console.error("Error fetching game packs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
