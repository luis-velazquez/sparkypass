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
  // Streak Fuse retired — streak protection is now a free automatic weekly grace
  // (one missed day forgiven per 7 days). See lib/streak.ts.
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
  sparky_tip: {
    type: "sparky_tip",
    name: "Sparky Tip",
    description: "Unlock a random NEC pro tip from Sparky's vault. Each tip covers a unique exam trap or code nuance.",
    cost: 1000,
    duration: "Instant",
    icon: "Lightbulb",
  },
};

export const POWER_UP_LIST = Object.values(POWER_UP_DEFINITIONS);

export function getPowerUpCost(type: PowerUpTypeValue): number {
  return POWER_UP_DEFINITIONS[type]?.cost || 0;
}

export function getPowerUpName(type: PowerUpTypeValue): string {
  return POWER_UP_DEFINITIONS[type]?.name || type;
}
