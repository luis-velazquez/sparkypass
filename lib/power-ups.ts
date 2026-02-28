import type { PowerUpTypeValue } from "@/lib/db/schema";

export interface PowerUpDefinition {
  type: PowerUpTypeValue;
  name: string;
  description: string;
  cost: number;
  duration: string;
  icon: string; // lucide icon name
}

export const POWER_UP_DEFINITIONS: Record<PowerUpTypeValue, PowerUpDefinition> = {
  streak_fuse: {
    type: "streak_fuse",
    name: "Streak Fuse",
    description: "Protects your study streak for 24 hours. If you miss a day, your streak stays intact!",
    cost: 200,
    duration: "24 hours",
    icon: "Shield",
  },
  formula_sheet: {
    type: "formula_sheet",
    name: "Formula Sheet",
    description: "Reveals all formulas and NEC references during your next quiz, regardless of your voltage tier scaffolding.",
    cost: 150,
    duration: "1 quiz",
    icon: "FileText",
  },
  breaker_reset: {
    type: "breaker_reset",
    name: "Breaker Reset",
    description: "Instantly resets a tripped circuit breaker without waiting for the cooldown timer.",
    cost: 100,
    duration: "Instant",
    icon: "RotateCcw",
  },
};

export const POWER_UP_LIST = Object.values(POWER_UP_DEFINITIONS);

export function getPowerUpCost(type: PowerUpTypeValue): number {
  return POWER_UP_DEFINITIONS[type]?.cost || 0;
}

export function getPowerUpName(type: PowerUpTypeValue): string {
  return POWER_UP_DEFINITIONS[type]?.name || type;
}
