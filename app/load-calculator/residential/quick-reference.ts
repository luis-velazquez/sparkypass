import type { NecVersion } from "@/types/question";
import type { CalculationStep } from "./types";
import { CALCULATION_STEPS } from "./steps";
import { getResServicesFeedersTableRef } from "../_shared/nec";

// Quick Reference items and when they're covered (step ID that completes coverage)
export function getQuickReferenceItems(necVersion: NecVersion = "2023") {
  const tableRef = getResServicesFeedersTableRef(necVersion);
  return [
    { id: "motor-flc", label: "Motor FLC", value: "Table 430.248: HP → Amps (115V or 230V column)", coveredAfterStep: "hvac" },
    { id: "general-lighting", label: "General Lighting", value: "3 VA/sq ft (220.41)", coveredAfterStep: "general-lighting" },
    { id: "small-appliance", label: "Small Appliance + Laundry", value: "2 circuits @ 1,500 VA + 1 laundry @ 1,500 VA (220.52)", coveredAfterStep: "small-appliance-laundry" },
    { id: "lighting-demand", label: "Lighting Demand", value: "First 3kVA: 100% | 3,001–120kVA: 35% | Over 120kVA: 25% (Table 220.45)", coveredAfterStep: "lighting-demand" },
    { id: "hvac", label: "HVAC", value: "Larger of heating OR cooling (220.60)", coveredAfterStep: "hvac" },
    { id: "fixed-appliances", label: "Fixed Appliances", value: "75% demand if 4+ appliances (220.53)", coveredAfterStep: "fixed-appliances" },
    { id: "dryer", label: "Dryer", value: "5,000 VA minimum (220.54)", coveredAfterStep: "dryer" },
    { id: "range", label: "Range/Cooking", value: "Table 220.55: Col A/B (<8¾ kW) = 80%, Col C (≥8¾ kW) = 8 kW", coveredAfterStep: "range" },
    { id: "largest-motor", label: "Largest Motor", value: "Add 25% to largest motor (220.50)", coveredAfterStep: "largest-motor-25" },
    { id: "service-sizing", label: "Service Sizing", value: `Total VA ÷ Voltage (${tableRef})`, coveredAfterStep: "service-amps" },
    { id: "conductor", label: "Conductor Sizing", value: `${tableRef}: Copper conductor ampacity`, coveredAfterStep: "service-conductor" },
    { id: "gec", label: "GEC Sizing", value: "Table 250.66: Based on service conductor size", coveredAfterStep: "gec-size" },
  ];
}

/** Default quick reference (2023 NEC) — used by isQuickRefCovered */
export const QUICK_REFERENCE_ITEMS = getQuickReferenceItems("2023");

// Check if a quick reference item has been covered based on current step
export function isQuickRefCovered(itemId: string, currentStepIndex: number, steps: CalculationStep[] = CALCULATION_STEPS): boolean {
  const item = QUICK_REFERENCE_ITEMS.find(i => i.id === itemId);
  if (!item) return false;

  const coveredStepIndex = steps.findIndex(s => s.id === item.coveredAfterStep);
  if (coveredStepIndex !== -1) {
    return currentStepIndex > coveredStepIndex;
  }

  // Step was filtered out — find the next step in the original order that exists in filtered steps
  const originalIndex = CALCULATION_STEPS.findIndex(s => s.id === item.coveredAfterStep);
  if (originalIndex === -1) return false;

  for (let i = originalIndex + 1; i < CALCULATION_STEPS.length; i++) {
    const filteredIndex = steps.findIndex(s => s.id === CALCULATION_STEPS[i].id);
    if (filteredIndex !== -1) {
      return currentStepIndex >= filteredIndex;
    }
  }

  return false;
}
