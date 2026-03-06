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
    { id: "outlet-loads", label: "Outlet Loads", value: `${getOutletLoadsRef(necVersion)}: Lampholders 600 VA, Recepts 180 VA, Show Window 200 VA/ft, Sign 1,200 VA`, coveredAfterStep: "outlet-loads" },
    { id: "receptacle-demand", label: "Receptacle Demand", value: `${getReceptacleDemandTableRef(necVersion)}: Sign outlet excluded (600.5(A)), first 10 kVA @ 100%, remainder @ 50%`, coveredAfterStep: "receptacle-demand" },
    { id: "kitchen-demand", label: "Kitchen Equipment", value: `${getKitchenEquipmentTableRef(necVersion)}: 1-2 units 100%, 3=90%, 4=80%, 5=70%, 6+=65%`, coveredAfterStep: "kitchen-demand" },
    { id: "largest-motor", label: "Largest Motor", value: `${getMotorLoadRef(necVersion)}: Add 25% of largest motor load`, coveredAfterStep: "largest-motor-25" },
    { id: "conductor", label: "Conductor Sizing", value: "Table 310.16: 75°C ampacity (Cu & Al)", coveredAfterStep: "service-conductor" },
    { id: "gec", label: "GEC Sizing", value: "Table 250.66: Based on service conductor size", coveredAfterStep: "gec-size" },
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
