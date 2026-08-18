import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, gameMasteryState, gamePackPurchases } from "@/lib/db";
import { eq, and } from "drizzle-orm";

/** A run passes its pack at this share of the deck correct — the same 70%
 *  line the mobile pack tiles draw (PACK_PASS_RATIO). */
const PACK_PASS_RATIO = 0.7;

/** Legacy rule for legacy bodies (the web game pages, which have no pack
 *  context and whose UI promises "10 correct unlocks the next pack"). Keeps
 *  the live web game coherent until it's retired — delete with the web
 *  teardown. Chain bodies (mobile) never use this. */
const MASTERY_CORRECT_THRESHOLD = 10;

const MASTERY_GAMES = ["index-sniper", "translation-engine"] as const;
type MasteryGameId = (typeof MASTERY_GAMES)[number];

/**
 * Total merged pack count per game (index 0 = free, rest = merged expansion packs).
 * Index Trace: free + 11 merged pairs + NEC Tables = 13
 * Slang to Code: free + 5 merged pairs = 6
 */
const MERGED_PACK_COUNT: Record<MasteryGameId, number> = {
  "index-sniper": 13,
  "translation-engine": 6,
};

/** Ordered merged pack IDs — must match game-packs/route.ts and each game's
 *  data layer, so the POST frontier agrees with what GET reports as unlocked. */
const MASTERY_PACK_IDS: Record<MasteryGameId, string[]> = {
  "index-sniper": ["free", ...Array.from({ length: 11 }, (_, i) => `merged-${i + 1}`), "tables"],
  "translation-engine": ["free", ...Array.from({ length: 5 }, (_, i) => `merged-${i + 1}`)],
};

/** Given legacy purchases, find the highest pack position index (same folding
 *  game-packs GET applies when reporting unlockedIndex). */
function highestPurchasedIndex(packOrder: string[], purchasedIds: string[]): number {
  let max = 0;
  for (const id of purchasedIds) {
    const idx = packOrder.indexOf(id);
    if (idx > max) max = idx;
  }
  return max;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { gameId, totalCorrect, packIndex, deckSize } = body as {
      gameId: string;
      totalCorrect: number;
      packIndex?: number;
      deckSize?: number;
    };

    if (!MASTERY_GAMES.includes(gameId as MasteryGameId)) {
      return NextResponse.json({ error: "Invalid game" }, { status: 400 });
    }
    if (typeof totalCorrect !== "number" || totalCorrect < 0) {
      return NextResponse.json({ error: "Invalid totalCorrect" }, { status: 400 });
    }
    // Chain-style runs identify which pack was played and how big its deck is.
    // A body without them (legacy web client) still records bestCorrect but can
    // never advance the unlock chain.
    const chainRun = packIndex !== undefined || deckSize !== undefined;
    if (
      chainRun &&
      (!Number.isInteger(packIndex) ||
        (packIndex as number) < 0 ||
        !Number.isInteger(deckSize) ||
        (deckSize as number) <= 0 ||
        totalCorrect > (deckSize as number))
    ) {
      return NextResponse.json(
        { error: "Invalid packIndex/deckSize" },
        { status: 400 },
      );
    }

    const typedGameId = gameId as MasteryGameId;
    const totalPacks = MERGED_PACK_COUNT[typedGameId];
    const maxPackIndex = totalPacks - 1;

    // Look up existing mastery row + legacy pack purchases in parallel
    const [masteryRows, purchases] = await Promise.all([
      db
        .select()
        .from(gameMasteryState)
        .where(
          and(
            eq(gameMasteryState.userId, userId),
            eq(gameMasteryState.gameId, typedGameId),
          ),
        ),
      db
        .select({ packId: gamePackPurchases.packId })
        .from(gamePackPurchases)
        .where(
          and(
            eq(gamePackPurchases.userId, userId),
            eq(gamePackPurchases.gameId, typedGameId),
          ),
        ),
    ]);
    const existing = masteryRows[0];

    // The frontier must agree with what GET /api/game-packs reports as
    // unlocked, which folds legacy purchases in — otherwise a legacy purchaser
    // gets spurious "unlocked!" celebrations for packs they already own.
    const legacyIndex = highestPurchasedIndex(
      MASTERY_PACK_IDS[typedGameId],
      purchases.map((p: { packId: string }) => p.packId),
    );
    const currentIndex = Math.max(
      existing?.unlockedPackIndex ?? 0,
      legacyIndex,
    );
    const previousBest = existing?.bestStreak ?? 0; // column stores best correct count
    const newBest = Math.max(previousBest, totalCorrect);

    // The unlock CHAIN (chain bodies — mobile): pack N+1 unlocks only by
    // PASSING (>=70% of the deck) pack N while N is the frontier — replaying
    // earlier packs, or racking up raw correct counts, never advances it.
    // packIndex must equal the server's frontier exactly: lower is a replay
    // (no-op), higher is a desynced or forged claim (rejected — the client
    // couldn't legitimately play it).
    // Legacy bodies (web game pages) keep the old 10-correct rule so the live
    // web UI stays coherent until the web teardown.
    const canUnlock = chainRun
      ? packIndex === currentIndex &&
        currentIndex < maxPackIndex &&
        totalCorrect / (deckSize as number) >= PACK_PASS_RATIO
      : totalCorrect >= MASTERY_CORRECT_THRESHOLD && currentIndex < maxPackIndex;
    const newIndex = canUnlock ? currentIndex + 1 : currentIndex;

    if (existing) {
      await db
        .update(gameMasteryState)
        .set({
          bestStreak: newBest, // repurposed: stores best correct count
          unlockedPackIndex: newIndex,
          updatedAt: new Date(),
        })
        .where(eq(gameMasteryState.id, existing.id));
    } else {
      const id = crypto.randomUUID();
      await db.insert(gameMasteryState).values({
        id,
        userId,
        gameId: typedGameId,
        unlockedPackIndex: newIndex,
        bestStreak: newBest,
        updatedAt: new Date(),
      });
    }

    if (canUnlock) {
      return NextResponse.json({
        unlocked: true,
        newPackIndex: newIndex,
        bestCorrect: newBest,
      });
    }

    return NextResponse.json({
      unlocked: false,
      currentPackIndex: newIndex,
      bestCorrect: newBest,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error updating game mastery:", msg, error);
    return NextResponse.json(
      { error: "Internal server error", detail: msg },
      { status: 500 },
    );
  }
}
