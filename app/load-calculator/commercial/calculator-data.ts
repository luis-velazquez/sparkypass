// Commercial Service Load Calculator Data — barrel re-export
// All logic lives in focused modules; this file re-exports everything
// so that page.tsx and other consumers don't need to change their imports.

// Core types
export * from "./types";

// Version-aware resolvers
export * from "./resolvers";

// Helpers (motor conversion, HVAC sub-step, motor sub-steps)
export * from "./helpers";

// Equipment display items + accounting
export * from "./equipment-display";

// Calculation steps
export * from "./steps";

// Step-to-equipment tracking (scratch-off, total-va components)
export * from "./step-tracking";

// Quick reference items + coverage check
export * from "./quick-reference";

// Sparky messages
export * from "./sparky-messages";

// Commercial scenarios
export { COMMERCIAL_SCENARIOS, ALL_COMMERCIAL_SCENARIOS, BUILDING_TYPES } from "./scenarios";

// Re-export shared types and NEC rules for backward compat
export {
  DIFFICULTY_LEVELS,
  type DifficultyLevel,
  type DifficultyOption,
  type HvacMotorSubStep,
} from "../_shared/types";
export { getRandomMessage } from "../_shared/utils";
export {
  MOTOR_FLC_TABLE,
  getMotorAmps,
  hpToWatts,
  MOTOR_FLC_TABLE_3PHASE,
  getMotorAmps3Phase,
  getMotorFLC,
  motorToVA,
  getMotorTableInfo,
  getServiceAmps,
  roundFractionalAmps,
  getFractionsOfAnAmpereRef,
  LIGHTING_LOAD_TABLE,
  getLightingLoadTableRef,
  LIGHTING_DEMAND_TABLE,
  applyLightingDemand,
  getLightingDemandTableRef,
  applyReceptacleDemand,
  getReceptacleDemandTableRef,
  KITCHEN_DEMAND_FACTORS,
  getKitchenDemandFactor,
  getKitchenEquipmentTableRef,
  type DemandTier,
  type ConductorEntry,
  getOutletLoadsRef,
  getTotalLoadRef,
  getMotorLoadRef,
  getHvacRef,
} from "../_shared/nec";
