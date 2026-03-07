import type { NecVersion } from "@/types/question";
import { COMMERCIAL_CALCULATION_STEPS } from "./steps";
import {
  getLightingLoadTableRef,
  getLightingDemandTableRef,
  getReceptacleDemandTableRef,
  getKitchenEquipmentTableRef,
  getOutletLoadsRef,
  getMotorLoadRef,
  getHvacRef,
} from "../_shared/nec";

export function getCommercialQuickReference(necVersion: NecVersion = "2023") {
  return [
    { id: "lighting-load", label: "General Lighting", value: `${getLightingLoadTableRef(necVersion)}: VA/sq ft × sq ft (125% already included)`, coveredAfterStep: "lighting-load" },
    { id: "lighting-demand", label: "Lighting Demand", value: `${getLightingDemandTableRef(necVersion)}: Warehouse 100%/50%, others 100%`, coveredAfterStep: "lighting-demand" },
    { id: "hvac", label: "HVAC", value: `${getHvacRef(necVersion)}: Larger of heating OR cooling (1Ø→430.248, 3Ø→430.250)`, coveredAfterStep: "hvac" },
    { id: "outlet-loads", label: "Other Loads", value: `${getOutletLoadsRef(necVersion)}: Recepts 180 VA, Multioutlet 180 VA/ft (demand: ${getReceptacleDemandTableRef(necVersion)} 10kVA@100%, rest@50%); Show Window 200 VA/ft, Lampholders 600 VA, Sign 1,200 VA @100%`, coveredAfterStep: "outlet-loads" },
    { id: "kitchen-demand", label: "Kitchen Equipment", value: `${getKitchenEquipmentTableRef(necVersion)}: 1-2 units 100%, 3=90%, 4=80%, 5=70%, 6+=65%`, coveredAfterStep: "kitchen-demand" },
    { id: "largest-motor", label: "Largest Motor", value: `${getMotorLoadRef(necVersion)}: Add 25% of largest motor load`, coveredAfterStep: "largest-motor-25" },
  ];
}

/** Default quick reference (2023 NEC) — used by isCommercialQuickRefCovered */
export const COMMERCIAL_QUICK_REFERENCE = getCommercialQuickReference("2023");

export function isCommercialQuickRefCovered(itemId: string, currentStepIndex: number): boolean {
  const item = COMMERCIAL_QUICK_REFERENCE.find(i => i.id === itemId);
  if (!item) return false;
  const coveredStepIndex = COMMERCIAL_CALCULATION_STEPS.findIndex(s => s.id === item.coveredAfterStep);
  return coveredStepIndex !== -1 && currentStepIndex > coveredStepIndex;
}
