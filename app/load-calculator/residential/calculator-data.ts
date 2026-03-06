// Dwelling Unit Load Calculator Data — barrel re-export
// All logic lives in focused modules; this file re-exports everything
// so that page.tsx and other consumers don't need to change their imports.

// Core types
export * from "./types";

// Version-aware resolvers
export * from "./resolvers";

// Helpers (motor conversion, fixed appliances, HVAC sub-step)
export * from "./helpers";

// Calculation steps + filtered steps
export * from "./steps";

// Step-to-appliance tracking (scratch-off, total-va components)
export * from "./step-tracking";

// Quick reference items + coverage check
export * from "./quick-reference";

// Sparky messages
export * from "./sparky-messages";

// Standard appliances (small appliance circuits + laundry)
export { STANDARD_APPLIANCES } from "./standard-appliances";

// Dwelling unit scenarios
export { HOUSE_SCENARIOS } from "./scenarios";

// Re-export NEC rules for backward compat
export {
  MOTOR_FLC_TABLE,
  getMotorAmps,
  hpToWatts,
  getConductorSize,
  getGECSize,
  CONDUCTOR_TABLE,
  roundFractionalAmps,
  getFractionsOfAnAmpereRef,
  DWELLING_CONDUCTOR_TABLE,
  getDwellingConductorSize,
  getDwellingAluminumSize,
  getResServicesFeedersTableRef,
  parseConductorInput,
  conductorSizeToCode,
  conductorCodeToLabel,
} from "../_shared/nec";

// Re-export shared types for backward compat
export {
  DIFFICULTY_LEVELS,
  type DifficultyLevel,
  type DifficultyOption,
  type HvacMotorSubStep,
} from "../_shared/types";

// Re-export getRandomMessage for backward compat
export { getRandomMessage } from "../_shared/utils";
