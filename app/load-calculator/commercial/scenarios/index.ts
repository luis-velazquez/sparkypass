import type { BuildingType } from "../types";
import { RETAIL_STORE_VARIANTS } from "./retail-store";
import { RESTAURANT_VARIANTS } from "./restaurant";
import { OFFICE_BUILDING_VARIANTS } from "./office-building";
import { WAREHOUSE_VARIANTS } from "./warehouse";

export { RETAIL_STORE_VARIANTS } from "./retail-store";
export { RESTAURANT_VARIANTS } from "./restaurant";
export { OFFICE_BUILDING_VARIANTS } from "./office-building";
export { WAREHOUSE_VARIANTS } from "./warehouse";

// All variants flat (for resume lookup by exact variant ID)
export const ALL_COMMERCIAL_SCENARIOS = [
  ...RETAIL_STORE_VARIANTS,
  ...RESTAURANT_VARIANTS,
  ...OFFICE_BUILDING_VARIANTS,
  ...WAREHOUSE_VARIANTS,
];

// Building type metadata for the selection UI
export const BUILDING_TYPES: BuildingType[] = [
  {
    buildingType: "retail",
    name: "Retail Store",
    description: "Show window displays, receptacle loads, and HVAC sizing for a retail space",
    difficulty: "mixed",
    voltage: 208,
    phases: 3,
    variants: RETAIL_STORE_VARIANTS,
  },
  {
    buildingType: "restaurant",
    name: "Restaurant",
    description: "Commercial kitchen equipment, Table 220.56 demand factors, and multiple motors",
    difficulty: "mixed",
    voltage: 208,
    phases: 3,
    variants: RESTAURANT_VARIANTS,
  },
  {
    buildingType: "office",
    name: "Office Building",
    description: "Multioutlet assemblies, large receptacle loads, and elevator motors",
    difficulty: "mixed",
    voltage: 208,
    phases: 3,
    variants: OFFICE_BUILDING_VARIANTS,
  },
  {
    buildingType: "warehouse",
    name: "Warehouse",
    description: "Tiered warehouse lighting demand, lampholder loads, and dock/conveyor motors",
    difficulty: "mixed",
    voltage: 208,
    phases: 3,
    variants: WAREHOUSE_VARIANTS,
  },
];

// Backward compat alias (first variant of each type)
export const COMMERCIAL_SCENARIOS = BUILDING_TYPES.map(bt => bt.variants[0]);
