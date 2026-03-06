import type { CommercialScenario, EquipmentDisplayItem } from "./types";
import { COMMERCIAL_CALCULATION_STEPS } from "./steps";
import { COMMERCIAL_STEP_EQUIPMENT_MAP } from "./step-tracking";

// Get flattened equipment list for display
export function getEquipmentDisplayItems(scenario: CommercialScenario): EquipmentDisplayItem[] {
  const items: EquipmentDisplayItem[] = [];

  // Building info
  items.push({
    id: "square-footage",
    name: "Square Footage",
    value: `${scenario.squareFootage.toLocaleString()} sq ft`,
    category: "building",
  });
  // Outlets
  if (scenario.lampholders > 0) {
    items.push({
      id: "lampholders",
      name: "Heavy-Duty Lampholders",
      value: `${scenario.lampholders}`,
      category: "outlets",
    });
  }
  items.push({
    id: "receptacles",
    name: "Receptacle Outlets",
    value: `${scenario.receptacles}`,
    category: "outlets",
  });
  if (scenario.multioutletAssemblyFeet > 0) {
    items.push({
      id: "multioutlet",
      name: "Multioutlet Assembly",
      value: `${scenario.multioutletAssemblyFeet} ft`,
      category: "outlets",
    });
  }
  if (scenario.showWindowFeet > 0) {
    items.push({
      id: "show-window",
      name: "Show Window Lighting",
      value: `${scenario.showWindowFeet} ft`,
      category: "outlets",
    });
  }
  if (scenario.hasSignOutlet) {
    items.push({
      id: "sign-outlet",
      name: "Sign Outlet",
      value: "1,200 VA",
      category: "outlets",
    });
  }

  // Kitchen equipment
  scenario.kitchenEquipment.forEach((item, i) => {
    items.push({
      id: `kitchen-${i}`,
      name: item.name,
      value: `${item.watts.toLocaleString()} W`,
      category: "kitchen",
    });
  });

  // HVAC
  if (scenario.acMotor) {
    const phaseLabel = scenario.acMotor.phase === 1 ? "1Ø" : "3Ø";
    items.push({
      id: "ac-motor",
      name: `A/C (${scenario.acMotor.horsepower} HP, ${phaseLabel} @ ${scenario.acMotor.voltage}V)`,
      value: `${scenario.acMotor.horsepower} HP`,
      category: "hvac",
    });
  }
  if (scenario.heatWatts > 0) {
    items.push({
      id: "heat",
      name: "Electric Heat",
      value: `${scenario.heatWatts.toLocaleString()} W`,
      category: "hvac",
    });
  }

  // Other motors
  scenario.otherMotors.forEach((motor, i) => {
    const phaseLabel = motor.phase === 1 ? "1Ø" : "3Ø";
    items.push({
      id: `motor-${i}`,
      name: `${motor.name} (${motor.horsepower} HP, ${phaseLabel} @ ${motor.voltage}V)`,
      value: `${motor.horsepower} HP`,
      category: "motors",
    });
  });

  return items;
}

// Get kitchen equipment IDs for a scenario
export function getKitchenEquipmentIds(scenario: CommercialScenario): string[] {
  return scenario.kitchenEquipment.map((_, i) => `kitchen-${i}`);
}

// Get motor IDs for a scenario (includes A/C motor)
export function getMotorIds(scenario: CommercialScenario): string[] {
  const ids: string[] = [];
  if (scenario.acMotor) ids.push("ac-motor");
  scenario.otherMotors.forEach((_, i) => ids.push(`motor-${i}`));
  return ids;
}

// Get all equipment IDs accounted for up to a step index
export function getAccountedEquipmentIds(
  stepIndex: number,
  scenario: CommercialScenario
): Set<string> {
  const accountedIds = new Set<string>();

  for (let i = 0; i <= stepIndex; i++) {
    const stepId = COMMERCIAL_CALCULATION_STEPS[i]?.id;
    if (!stepId) continue;

    const staticIds = COMMERCIAL_STEP_EQUIPMENT_MAP[stepId] || [];
    staticIds.forEach(id => accountedIds.add(id));

    // Kitchen step accounts for all kitchen items
    if (stepId === "kitchen-demand") {
      getKitchenEquipmentIds(scenario).forEach(id => accountedIds.add(id));
    }
    // Motor 25% step accounts for all motors
    if (stepId === "largest-motor-25") {
      getMotorIds(scenario).forEach(id => accountedIds.add(id));
    }
  }

  return accountedIds;
}
