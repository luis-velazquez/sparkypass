// Reward system for SparkyPass — Resistance & Reward: P = V × I
// Re-exports from voltage.ts and watts.ts for convenience

export {
  DIFFICULTY_VOLTAGE,
  VOLTAGE_PROGRESSION,
  getStreakBoostedVoltage,
  getUserClassification,
  getClassificationTitle,
  getClassificationProgress,
  checkClassificationAdvancement,
  getScaffolding,
  CLASSIFICATIONS,
} from "./voltage";

export {
  ACTIVITY_VOLTAGE,
  INDEX_GAME_WATTS_PER_CORRECT,
  RESISTANCE_PENALTIES,
  PASS_THRESHOLD,
  STREAK_WATTS_MILESTONES,
  POWER_UP_COSTS,
  calculateQuizTotal,
  getStreakMilestoneReward,
  canAffordPowerUp,
} from "./watts";
