import type { CommercialScenario, MotorSubStep } from "./types";
import type { HvacMotorSubStep } from "../_shared/types";
import type { NecVersion } from "@/types/question";
import { motorToVA, getMotorFLC, getMotorTableInfo, getHvacRef } from "../_shared/nec";

/** Returns true if the A/C motor's load is included in the calculation (A/C won 220.60) */
export function isAcMotorInCalc(scenario: CommercialScenario): boolean {
  if (!scenario.acMotor) return false;
  return Math.round(motorToVA(scenario.acMotor) * 1.25) >= scenario.heatWatts;
}

// ─── Helper: Get non-HVAC motors from a scenario ────────────────────────────

export function getNonHvacMotorLoads(scenario: CommercialScenario): { name: string; va: number; phase: 1 | 3; hp: number; voltage: number }[] {
  const motors: { name: string; va: number; phase: 1 | 3; hp: number; voltage: number }[] = [];
  for (const m of scenario.otherMotors) {
    motors.push({
      name: m.name,
      va: motorToVA(m),
      phase: m.phase,
      hp: m.horsepower,
      voltage: m.voltage,
    });
  }
  return motors;
}

/** Get all motors whose VA loads are included in the total (for 25% calculation) */
export function getMotorsInCalculation(scenario: CommercialScenario): { name: string; va: number }[] {
  const motors: { name: string; va: number }[] = [];
  if (scenario.acMotor && isAcMotorInCalc(scenario)) {
    motors.push({ name: scenario.acMotor.name, va: motorToVA(scenario.acMotor) });
  }
  for (const m of scenario.otherMotors) {
    motors.push({ name: m.name, va: motorToVA(m) });
  }
  return motors;
}

// ─── Motor Sub-Steps ─────────────────────────────────────────────────────────

export function getMotorSubSteps(scenario: CommercialScenario): MotorSubStep[] {
  const subSteps: MotorSubStep[] = [];

  // A/C motor is NOT included here — it's already converted during the HVAC step (220.60)

  scenario.otherMotors.forEach((motor, i) => {
    const flc = getMotorFLC(motor);
    const va = motorToVA(motor);
    const { tableNum, tableCol } = getMotorTableInfo(motor);
    const phaseLabel = motor.phase === 1 ? "1Ø" : "3Ø";

    const formulaStr = motor.phase === 3
      ? `FLC × ${motor.voltage}V × √3`
      : `FLC × ${motor.voltage}V`;

    const hintStr = motor.phase === 3
      ? `${motor.name}: ${motor.horsepower} HP, ${phaseLabel} @ ${motor.voltage}V\nTable ${tableNum} (${tableCol}): ${flc} A\n${flc} × ${motor.voltage}V × √3 = ${va.toLocaleString()} VA`
      : `${motor.name}: ${motor.horsepower} HP, ${phaseLabel} @ ${motor.voltage}V\nTable ${tableNum} (${tableCol}): ${flc} A\n${flc} × ${motor.voltage}V = ${va.toLocaleString()} VA`;

    subSteps.push({
      equipmentId: `motor-${i}`,
      motorName: motor.name,
      hp: motor.horsepower,
      voltage: motor.voltage,
      phase: motor.phase,
      expectedVA: va,
      sparkyPrompt: `Convert the ${motor.name} (${motor.horsepower} HP, ${phaseLabel} @ ${motor.voltage}V) from HP to VA. Look up the FLC in Table ${tableNum} (${tableCol} column), then multiply by voltage${motor.phase === 3 ? " × √3" : ""}.`,
      hint: hintStr,
      formula: formulaStr,
      necReference: `NEC Table ${tableNum}`,
    });
  });

  return subSteps;
}

// ─── HVAC Motor Sub-Step (220.60) ─────────────────────────────────────────
// When the student reaches the HVAC step, they first convert the A/C motor HP→VA

export function getHvacMotorSubStep(scenario: CommercialScenario, necVersion: NecVersion = "2023"): HvacMotorSubStep | null {
  if (!scenario.acMotor) return null;

  const motor = scenario.acMotor;
  const flc = getMotorFLC(motor);
  const va = motorToVA(motor);
  const { tableNum, tableCol } = getMotorTableInfo(motor);
  const phaseLabel = motor.phase === 1 ? "1Ø" : "3Ø";

  const formulaStr = motor.phase === 3
    ? `FLC (Table ${tableNum}, ${tableCol}) × ${motor.voltage}V × √3`
    : `FLC (Table ${tableNum}, ${tableCol}) × ${motor.voltage}V`;

  const hintCalc = motor.phase === 3
    ? `${flc} × ${motor.voltage}V × √3 = ${va.toLocaleString()} VA`
    : `${flc} × ${motor.voltage}V = ${va.toLocaleString()} VA`;

  return {
    motorName: motor.name,
    hp: motor.horsepower,
    voltage: motor.voltage,
    expectedVA: va,
    sparkyPrompt: `Per ${getHvacRef(necVersion)}, we need to compare heating and cooling loads. But first, the A/C is rated in horsepower — let's convert it to VA. Look up ${motor.horsepower} HP in Table ${tableNum} (${tableCol} column) to find the Full-Load Current, then multiply by ${motor.voltage}V${motor.phase === 3 ? " × √3 for three-phase" : ""}.`,
    hint: `${motor.name}: ${motor.horsepower} HP, ${phaseLabel} @ ${motor.voltage}V\nTable ${tableNum} (${tableCol}): ${flc} A\n${hintCalc}`,
    formula: formulaStr,
    necReference: `NEC Table ${tableNum}`,
  };
}
