// Voltage Tiers (V) — Milestone-based progression
// Tiers are earned by content mastery, NOT daily activity

import type { VoltageTier, VoltageTierConfig, VoltageTierProgress } from "@/types/reward-system";

export const VOLTAGE_TIERS: VoltageTierConfig[] = [
  {
    tier: 1,
    voltage: "12V",
    title: "Low Voltage Trainee",
    multiplier: 0.5,
    requirements: { categoriesAtApprentice: 0, categoriesAtJourneyman: 0, categoriesAtMaster: 0, totalQuestions: 0, mockExams: 0 },
    scaffolding: { showHints: true, showFormulas: true, showNecReferences: true, showArticleNumbers: true },
  },
  {
    tier: 2,
    voltage: "120V",
    title: "Apprentice",
    multiplier: 1.0,
    requirements: { categoriesAtApprentice: 4, categoriesAtJourneyman: 0, categoriesAtMaster: 0, totalQuestions: 100, mockExams: 0 },
    scaffolding: { showHints: true, showFormulas: true, showNecReferences: true, showArticleNumbers: true },
  },
  {
    tier: 3,
    voltage: "240V",
    title: "Journeyman Candidate",
    multiplier: 1.5,
    requirements: { categoriesAtApprentice: 8, categoriesAtJourneyman: 3, categoriesAtMaster: 0, totalQuestions: 300, mockExams: 0 },
    scaffolding: { showHints: false, showFormulas: true, showNecReferences: true, showArticleNumbers: true },
  },
  {
    tier: 4,
    voltage: "277V",
    title: "Journeyman",
    multiplier: 1.8,
    requirements: { categoriesAtApprentice: 12, categoriesAtJourneyman: 6, categoriesAtMaster: 1, totalQuestions: 600, mockExams: 0 },
    scaffolding: { showHints: false, showFormulas: false, showNecReferences: true, showArticleNumbers: true },
  },
  {
    tier: 5,
    voltage: "480V",
    title: "Master Candidate",
    multiplier: 2.5,
    requirements: { categoriesAtApprentice: 14, categoriesAtJourneyman: 10, categoriesAtMaster: 4, totalQuestions: 1000, mockExams: 3 },
    scaffolding: { showHints: false, showFormulas: false, showNecReferences: false, showArticleNumbers: true },
  },
  {
    tier: 6,
    voltage: "600V",
    title: "Master Electrician",
    multiplier: 3.0,
    requirements: { categoriesAtApprentice: 16, categoriesAtJourneyman: 14, categoriesAtMaster: 8, totalQuestions: 2000, mockExams: 5 },
    scaffolding: { showHints: false, showFormulas: false, showNecReferences: false, showArticleNumbers: false },
  },
  {
    tier: 7,
    voltage: "13.8kV",
    title: "The Transformer",
    multiplier: 5.0,
    requirements: { categoriesAtApprentice: 16, categoriesAtJourneyman: 16, categoriesAtMaster: 14, totalQuestions: 5000, mockExams: 10 },
    scaffolding: { showHints: false, showFormulas: false, showNecReferences: false, showArticleNumbers: false },
  },
];

export function getVoltageTierConfig(tier: VoltageTier): VoltageTierConfig {
  return VOLTAGE_TIERS[tier - 1];
}

export function getVoltageTierTitle(tier: VoltageTier): string {
  return VOLTAGE_TIERS[tier - 1].title;
}

export function getVoltageString(tier: VoltageTier): string {
  return VOLTAGE_TIERS[tier - 1].voltage;
}

export function getVoltageMultiplier(tier: VoltageTier): number {
  return VOLTAGE_TIERS[tier - 1].multiplier;
}

export function getScaffolding(tier: VoltageTier) {
  return VOLTAGE_TIERS[tier - 1].scaffolding;
}

/**
 * Determine which voltage tier a user qualifies for based on their stats.
 * Returns the highest tier whose requirements are fully met.
 */
export function calculateVoltageTier(stats: {
  categoriesAtApprentice: number;
  categoriesAtJourneyman: number;
  categoriesAtMaster: number;
  totalQuestions: number;
  mockExams: number;
}): VoltageTier {
  let highestTier: VoltageTier = 1;

  for (const tierConfig of VOLTAGE_TIERS) {
    const reqs = tierConfig.requirements;
    if (
      stats.categoriesAtApprentice >= reqs.categoriesAtApprentice &&
      stats.categoriesAtJourneyman >= reqs.categoriesAtJourneyman &&
      stats.categoriesAtMaster >= reqs.categoriesAtMaster &&
      stats.totalQuestions >= reqs.totalQuestions &&
      stats.mockExams >= reqs.mockExams
    ) {
      highestTier = tierConfig.tier;
    }
  }

  return highestTier;
}

/**
 * Check if a tier advancement occurred.
 */
export function checkVoltageAdvancement(
  previousTier: VoltageTier,
  newTier: VoltageTier
): { newTier: VoltageTier; newTitle: string; newVoltage: string } | null {
  if (newTier > previousTier) {
    const config = getVoltageTierConfig(newTier);
    return { newTier, newTitle: config.title, newVoltage: config.voltage };
  }
  return null;
}

/**
 * Calculate progress toward the next voltage tier.
 */
export function getVoltageTierProgress(
  currentTier: VoltageTier,
  stats: {
    categoriesAtApprentice: number;
    categoriesAtJourneyman: number;
    categoriesAtMaster: number;
    totalQuestions: number;
    mockExams: number;
  }
): VoltageTierProgress {
  const currentConfig = getVoltageTierConfig(currentTier);
  const nextConfig = currentTier < 7 ? getVoltageTierConfig((currentTier + 1) as VoltageTier) : null;

  if (!nextConfig) {
    return {
      currentTier,
      currentVoltage: currentConfig.voltage,
      currentTitle: currentConfig.title,
      nextTier: null,
      progress: {
        categoriesAtApprentice: { current: stats.categoriesAtApprentice, needed: currentConfig.requirements.categoriesAtApprentice },
        categoriesAtJourneyman: { current: stats.categoriesAtJourneyman, needed: currentConfig.requirements.categoriesAtJourneyman },
        categoriesAtMaster: { current: stats.categoriesAtMaster, needed: currentConfig.requirements.categoriesAtMaster },
        totalQuestions: { current: stats.totalQuestions, needed: currentConfig.requirements.totalQuestions },
        mockExams: { current: stats.mockExams, needed: currentConfig.requirements.mockExams },
      },
      overallPercentage: 100,
    };
  }

  const nextReqs = nextConfig.requirements;
  const progressItems = [
    { current: Math.min(stats.categoriesAtApprentice, nextReqs.categoriesAtApprentice), needed: nextReqs.categoriesAtApprentice },
    { current: Math.min(stats.categoriesAtJourneyman, nextReqs.categoriesAtJourneyman), needed: nextReqs.categoriesAtJourneyman },
    { current: Math.min(stats.categoriesAtMaster, nextReqs.categoriesAtMaster), needed: nextReqs.categoriesAtMaster },
    { current: Math.min(stats.totalQuestions, nextReqs.totalQuestions), needed: nextReqs.totalQuestions },
    { current: Math.min(stats.mockExams, nextReqs.mockExams), needed: nextReqs.mockExams },
  ];

  // Only count requirements that are > 0 for percentage calculation
  const activeItems = progressItems.filter((p) => p.needed > 0);
  const overallPercentage = activeItems.length > 0
    ? Math.round(activeItems.reduce((sum, p) => sum + (p.current / p.needed) * 100, 0) / activeItems.length)
    : 100;

  return {
    currentTier,
    currentVoltage: currentConfig.voltage,
    currentTitle: currentConfig.title,
    nextTier: nextConfig,
    progress: {
      categoriesAtApprentice: { current: stats.categoriesAtApprentice, needed: nextReqs.categoriesAtApprentice },
      categoriesAtJourneyman: { current: stats.categoriesAtJourneyman, needed: nextReqs.categoriesAtJourneyman },
      categoriesAtMaster: { current: stats.categoriesAtMaster, needed: nextReqs.categoriesAtMaster },
      totalQuestions: { current: stats.totalQuestions, needed: nextReqs.totalQuestions },
      mockExams: { current: stats.mockExams, needed: nextReqs.mockExams },
    },
    overallPercentage: Math.min(overallPercentage, 99), // Cap at 99 until actually achieved
  };
}

/**
 * Map old level (1-10) to voltage tier (1-7) for migration.
 */
export function mapLevelToVoltageTier(level: number): VoltageTier {
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  if (level <= 6) return 3;
  if (level <= 7) return 4;
  if (level <= 9) return 5;
  return 5; // Level 10 → tier 5 (actual advancement requires meeting real requirements)
}
