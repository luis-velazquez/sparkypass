import type { Appliance, HouseScenario } from "./types";
import type { HvacMotorSubStep } from "../_shared/types";
import type { MotorInCalc } from "../_shared/nec";
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

/** Returns true if the A/C motor's load is included in the calculation (A/C won 220.60) */
export function isAcMotorInCalc(scenario: HouseScenario): boolean {
  const ac = scenario.appliances.find(a => a.id === "ac");
  if (!ac?.horsepower || !ac?.motorVoltage) return false;
  const heat = scenario.appliances.find(a => a.id === "heat");
  const heatWatts = heat?.watts || 0;
  const acWatts = hpToWatts(ac.horsepower, ac.motorVoltage);
  return Math.round(acWatts * 1.25) >= heatWatts;
}

/** Get motors whose VA loads are included in the total (for 25% largest motor).
 *  A/C is only included when it won the HVAC comparison (220.60); excluded when heating won. */
export function getMotorsInCalculation(scenario: HouseScenario): { name: string; watts: number }[] {
  const motors: { name: string; watts: number }[] = [];
  for (const m of getMotorAppliances(scenario)) {
    if (m.id === "ac") {
      if (isAcMotorInCalc(scenario)) {
        motors.push({ name: m.name, watts: hpToWatts(m.horsepower!, m.motorVoltage!) });
      }
      continue;
    }
    const watts = m.horsepower && m.motorVoltage ? hpToWatts(m.horsepower, m.motorVoltage) : m.watts;
    motors.push({ name: m.name, watts });
  }
  return motors;
}

// Get the largest motor load in watts (only motors included in the calculation)
export function getLargestMotorWatts(scenario: HouseScenario): number {
  const motors = getMotorsInCalculation(scenario);
  if (motors.length === 0) return 0;
  return Math.max(...motors.map(m => m.watts));
}

/** Adapt residential motors for the shared largest-motor-25 computation. */
export function toMotorsForCalc(scenario: HouseScenario): MotorInCalc[] {
  const acName = scenario.appliances.find(a => a.id === "ac" && a.isMotor)?.name;
  return getMotorsInCalculation(scenario).map(m => ({
    name: m.name,
    va: m.watts,
    isAc: m.name === acName,
  }));
}

// ─── Fixed Appliance Motor Sub-Steps ──────────────────────────────────────
// When the student reaches the fixed appliances step, help them convert each motor first

export function getFixedMotorSubSteps(scenario: HouseScenario): HvacMotorSubStep[] {
  const fixedAppliances = getFixedAppliances(scenario);
  const motors = fixedAppliances.filter(a => a.isMotor && a.horsepower && a.motorVoltage);

  return motors.map(m => {
    const tableColumn = m.motorVoltage === 120 ? "115V" : "230V";
    const amps = getMotorAmps(m.horsepower!, m.motorVoltage!);
    const va = hpToWatts(m.horsepower!, m.motorVoltage!);

    return {
      motorName: m.name,
      hp: m.horsepower!,
      voltage: m.motorVoltage!,
      expectedVA: va,
      sparkyPrompt: `Before we total the fixed appliances, the ${m.name} is rated in horsepower — let's convert it to VA. Look up ${m.horsepower} HP in Table 430.248 (${tableColumn} column) to find the Full-Load Current, then multiply by ${m.motorVoltage}V.`,
      hint: `${m.name}: ${m.horsepower} HP @ ${m.motorVoltage}V\nTable 430.248 (${tableColumn} column): ${m.horsepower} HP = ${amps} Amps\n${amps} × ${m.motorVoltage}V = ${va.toLocaleString()} VA`,
      formula: `FLC (Table 430.248, ${tableColumn}) × ${m.motorVoltage}V`,
      necReference: "NEC Table 430.248",
    };
  });
}

// IDs of appliances considered "fixed" (fastened in place) per NEC 220.53
// Includes water heater, disposal, pool pump, dishwasher, microwave, wine cooler, hot tub
// Excludes: cooking equipment, dryers, space heating, A/C, EV chargers (220.53 exceptions)
export const FIXED_APPLIANCE_IDS = ["water-heater", "dishwasher", "disposal", "microwave", "wine-cooler", "pool-pump", "hot-tub"];

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
