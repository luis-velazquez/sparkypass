import type { Appliance, HouseScenario } from "./types";
import type { HvacMotorSubStep } from "../_shared/types";
import { getMotorAmps, hpToWatts } from "../_shared/nec";

// ─── HVAC Motor Sub-Step (220.60) ─────────────────────────────────────────
// When the student reaches the HVAC step, they first convert the A/C motor HP→VA

export function getHvacMotorSubStep(scenario: HouseScenario): HvacMotorSubStep | null {
  const ac = scenario.appliances.find(a => a.id === "ac");
  if (!ac?.horsepower || !ac?.motorVoltage) return null;

  const tableColumn = ac.motorVoltage === 120 ? "115V" : "230V";
  const amps = getMotorAmps(ac.horsepower, ac.motorVoltage);
  const va = hpToWatts(ac.horsepower, ac.motorVoltage);

  return {
    motorName: ac.name,
    hp: ac.horsepower,
    voltage: ac.motorVoltage,
    expectedVA: va,
    sparkyPrompt: `Per 220.60, we need to compare heating and cooling loads. But first, the A/C is rated in horsepower — let's convert it to VA. Look up ${ac.horsepower} HP in Table 430.248 (${tableColumn} column) to find the Full-Load Current, then multiply by ${ac.motorVoltage}V.`,
    hint: `A/C: ${ac.horsepower} HP @ ${ac.motorVoltage}V\nTable 430.248 (${tableColumn} column): ${ac.horsepower} HP = ${amps} Amps\n${amps} × ${ac.motorVoltage}V = ${va.toLocaleString()} VA`,
    formula: `FLC (Table 430.248, ${tableColumn}) × ${ac.motorVoltage}V`,
    necReference: "NEC Table 430.248",
  };
}

// Get all motor appliances from a scenario
export function getMotorAppliances(scenario: HouseScenario): Appliance[] {
  return scenario.appliances.filter(a => a.isMotor);
}

// Get the largest motor load in watts
export function getLargestMotorWatts(scenario: HouseScenario): number {
  const motors = getMotorAppliances(scenario);
  if (motors.length === 0) return 0;

  return Math.max(...motors.map(m => {
    if (m.horsepower && m.motorVoltage) {
      return hpToWatts(m.horsepower, m.motorVoltage);
    }
    return m.watts;
  }));
}

// IDs of appliances considered "fixed" (fastened in place) per NEC 220.53
// Includes water heater, disposal, pool pump, dishwasher, microwave, wine cooler
export const FIXED_APPLIANCE_IDS = ["water-heater", "dishwasher", "disposal", "microwave", "wine-cooler", "pool-pump"];

// Helper to get fixed appliances from a scenario
export function getFixedAppliances(scenario: HouseScenario) {
  return scenario.appliances.filter(a => FIXED_APPLIANCE_IDS.includes(a.id));
}

// Calculate total watts for fixed appliances (converting HP motors to watts)
export function getFixedAppliancesWatts(scenario: HouseScenario): number {
  const fixedAppliances = getFixedAppliances(scenario);
  return fixedAppliances.reduce((sum, a) => {
    if (a.isMotor && a.horsepower && a.motorVoltage) {
      return sum + hpToWatts(a.horsepower, a.motorVoltage);
    }
    return sum + a.watts;
  }, 0);
}
