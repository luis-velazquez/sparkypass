import type { TranslationPack } from "../types";
import { freePack } from "./free";
import { pack1 } from "./pack-1";
import { pack2 } from "./pack-2";
import { pack3 } from "./pack-3";
import { pack4 } from "./pack-4";
import { pack5 } from "./pack-5";
import { pack6 } from "./pack-6";
import { pack7 } from "./pack-7";
import { pack9 } from "./pack-9";
import { pack10 } from "./pack-10";
import { pack11 } from "./pack-11";

/** Raw individual packs */
export const TRANSLATION_PACKS: TranslationPack[] = [
  freePack,
  pack1,
  pack2,
  pack3,
  pack4,
  pack5,
  pack6,
  pack7,
  pack9,
  pack10,
  pack11,
];

/** Merged packs for the pack picker — every two expansion packs combined into ~20 cards */
function mergePairs(packs: TranslationPack[]): TranslationPack[] {
  const expansion = packs.filter((p) => p.id !== "free");
  const merged: TranslationPack[] = [packs.find((p) => p.id === "free")!];
  for (let i = 0; i < expansion.length; i += 2) {
    const a = expansion[i];
    const b = expansion[i + 1];
    if (b) {
      merged.push({
        id: `merged-${Math.floor(i / 2) + 1}`,
        name: `Pack ${Math.floor(i / 2) + 1}`,
        cards: [...a.cards, ...b.cards],
      });
    } else {
      merged.push({
        id: `merged-${Math.floor(i / 2) + 1}`,
        name: `Pack ${Math.floor(i / 2) + 1}`,
        cards: [...a.cards],
      });
    }
  }
  return merged;
}

export const TRANSLATION_MERGED_PACKS: TranslationPack[] = mergePairs(TRANSLATION_PACKS);
