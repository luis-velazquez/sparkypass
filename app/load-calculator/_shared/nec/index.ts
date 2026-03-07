// Barrel export for all NEC rules

export type { DemandTier, ConductorEntry, DwellingConductorEntry, GECEntry } from "./types";

export { MOTOR_FLC_TABLE, getMotorAmps, hpToWatts } from "./res-motor-flc";
export { MOTOR_FLC_TABLE_3PHASE, getMotorAmps3Phase } from "./3-phase-motor-flc";
export { getMotorFLC, motorToVA, getMotorTableInfo } from "./motor-utils";
export { conductorSortValue, GEC_TABLE, getGECSize } from "./gec";
export { CONDUCTOR_TABLE, getConductorSize, getAluminumConductorSize } from "./amp-table";
export { DWELLING_CONDUCTOR_TABLE, getDwellingConductorSize, getDwellingAluminumSize, getResServicesFeedersTableRef } from "./res-services-feeders";
export { roundFractionalAmps, roundFractionalAmps as roundPer220_5B, getFractionsOfAnAmpereRef } from "./fractions-of-an-ampere";
export { getServiceAmps } from "./service-amps";
export { LIGHTING_LOAD_TABLE, getLightingLoadTableRef } from "./general-lighting-loads-non-dwelling";
export { LIGHTING_DEMAND_TABLE, applyLightingDemand, getLightingDemandTableRef } from "./lighting-load-demand-factors";
export { applyReceptacleDemand, getReceptacleDemandTableRef } from "./demand-factors-non-dwelling";
export { KITCHEN_DEMAND_FACTORS, getKitchenDemandFactor, getKitchenEquipmentTableRef } from "./kitchen-equipment-commercial";
export { parseConductorInput, conductorSizeToCode, conductorCodeToLabel } from "./conductor-utils";
export { getOutletLoadsRef, getTotalLoadRef, getMotorLoadRef, getHvacRef } from "./article-220-refs";
export type { MotorInCalc, LargestMotorResult } from "./largest-motor";
export { computeLargestMotor25, buildMotor25Prompt, buildMotor25Hint } from "./largest-motor";
