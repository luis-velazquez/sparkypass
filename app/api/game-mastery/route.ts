import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, gameMasteryState } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SNIPER_PACKS } from "@/app/(games)/index-sniper/sniper-data";
import { TRANSLATION_PACKS } from "@/app/(games)/translation-engine/translation-data";
import { MASTERY_CORRECT_THRESHOLD } from "@/app/(games)/shared";

const MASTERY_GAMES = ["index-sniper", "translation-engine"] as const;
type MasteryGameId = (typeof MASTERY_GAMES)[number];

function getPacksForGame(gameId: MasteryGameId) {
  return gameId === "index-sniper" ? SNIPER_PACKS : TRANSLATION_PACKS;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { gameId, totalCorrect } = body as { gameId: string; totalCorrect: number };

    if (!MASTERY_GAMES.includes(gameId as MasteryGameId)) {
      return NextResponse.json({ error: "Invalid game" }, { status: 400 });
    }
    if (typeof totalCorrect !== "number" || totalCorrect < 0) {
      return NextResponse.json({ error: "Invalid totalCorrect" }, { status: 400 });
    }

    const typedGameId = gameId as MasteryGameId;
    const packs = getPacksForGame(typedGameId);
    const maxPackIndex = packs.length - 1;

    // Look up existing mastery row
    const [existing] = await db
      .select()
      .from(gameMasteryState)
      .where(
        and(
          eq(gameMasteryState.userId, userId),
          eq(gameMasteryState.gameId, typedGameId),
        ),
      );

    const currentIndex = existing?.unlockedPackIndex ?? 0;
    const previousBest = existing?.bestStreak ?? 0; // column stores best correct count
    const newBest = Math.max(previousBest, totalCorrect);

    // Check if this session unlocks the next pack
    const canUnlock =
      totalCorrect >= MASTERY_CORRECT_THRESHOLD && currentIndex < maxPackIndex;
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
      const unlockedPack = packs[newIndex];
      const cardCount =
        "cards" in unlockedPack
          ? (unlockedPack as any).cards.length
          : "scenarios" in unlockedPack
            ? (unlockedPack as any).scenarios.length
            : 0;

      return NextResponse.json({
        unlocked: true,
        newPackName: unlockedPack.name,
        newPackCardCount: cardCount,
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
    console.error("Error updating game mastery:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
