// Centralized game pack catalog for the expansion pack shop system.
// Imports pack data from each game and builds a unified catalog with pricing.

import { SNIPER_PACKS } from "@/app/(games)/index-sniper/sniper-data";
import { TRANSLATION_PACKS } from "@/app/(games)/translation-engine/translation-data";
import { FORMULA_PACKS } from "@/app/(games)/formula-builder/builder-data";

export type GameId = "index-sniper" | "translation-engine" | "formula-builder";

export interface PackMeta {
  id: string;
  name: string;
  description: string;
  cost: number;
  cardCount: number;
  gameId: GameId;
}

function sniperPackCost(packId: string): number {
  return packId === "tables" ? 100 : 50;
}

function translationPackCost(packId: string): number {
  return packId === "pack-11" ? 100 : 50;
}

const FORMULA_PACK_COST = 75;

function buildCatalog(): Record<GameId, PackMeta[]> {
  const sniper: PackMeta[] = SNIPER_PACKS
    .filter((p) => p.id !== "free")
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: `${p.cards.length} NEC reference cards`,
      cost: sniperPackCost(p.id),
      cardCount: p.cards.length,
      gameId: "index-sniper" as const,
    }));

  const translation: PackMeta[] = TRANSLATION_PACKS
    .filter((p) => p.id !== "free")
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: `${p.cards.length} slang-to-official translation cards`,
      cost: translationPackCost(p.id),
      cardCount: p.cards.length,
      gameId: "translation-engine" as const,
    }));

  const formula: PackMeta[] = FORMULA_PACKS
    .filter((p) => p.id !== "free")
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: `${p.scenarios.length} calculation scenarios`,
      cost: FORMULA_PACK_COST,
      cardCount: p.scenarios.length,
      gameId: "formula-builder" as const,
    }));

  return {
    "index-sniper": sniper,
    "translation-engine": translation,
    "formula-builder": formula,
  };
}

export const GAME_PACK_CATALOG: Record<GameId, PackMeta[]> = buildCatalog();

export function getPackCost(gameId: GameId, packId: string): number | null {
  const pack = GAME_PACK_CATALOG[gameId]?.find((p) => p.id === packId);
  return pack?.cost ?? null;
}

export function getPackMeta(gameId: GameId, packId: string): PackMeta | null {
  return GAME_PACK_CATALOG[gameId]?.find((p) => p.id === packId) ?? null;
}
