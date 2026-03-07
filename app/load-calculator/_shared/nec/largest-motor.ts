// Shared "Largest Motor 25%" logic used by both residential and commercial calculators.
// Per NEC 220.50 (2026: 120.50) and 430.24, add 25% of the largest motor.

import type { NecVersion } from "@/types/question";
import { getMotorLoadRef, getHvacRef } from "./article-220-refs";

export interface MotorInCalc {
  name: string;
  va: number;
  isAc?: boolean;
}

export interface LargestMotorResult {
  motorsInCalc: MotorInCalc[];
  acExcluded: boolean;       // A/C exists but heating won 220.60
  hasAcMotor: boolean;       // scenario has an A/C motor at all
  largestVA: number;
  addition: number;          // Math.round(largestVA * 0.25)
}

/** Pure computation: find the largest motor and compute the 25% addition. */
export function computeLargestMotor25(
  motorsInCalc: MotorInCalc[],
  hasAcMotor: boolean,
): LargestMotorResult {
  const acInCalc = motorsInCalc.some(m => m.isAc);
  const acExcluded = hasAcMotor && !acInCalc;

  if (motorsInCalc.length === 0) {
    return { motorsInCalc, acExcluded, hasAcMotor, largestVA: 0, addition: 0 };
  }

  const largestVA = Math.max(...motorsInCalc.map(m => m.va));
  return {
    motorsInCalc,
    acExcluded,
    hasAcMotor,
    largestVA,
    addition: Math.round(largestVA * 0.25),
  };
}

/** Generate the sparkyPrompt for the largest-motor-25 step. */
export function buildMotor25Prompt(result: LargestMotorResult, v: NecVersion): string {
  const motorRef = getMotorLoadRef(v);
  const hvacRef = getHvacRef(v);

  if (result.motorsInCalc.length === 0) {
    if (result.acExcluded) {
      return `Per ${motorRef}, we add 25% of the largest motor. But the A/C was excluded by ${hvacRef} (heating was larger), and there are no other motors — enter 0.`;
    }
    return "There are no motors in this calculation. Enter 0.";
  }

  let prompt = `Per ${motorRef} and 430.24, add 25% of the largest motor's VA load to the service calculation. Consider all motors whose loads are included in our total.`;

  if (result.acExcluded) {
    prompt += ` Remember: the A/C motor was excluded by ${hvacRef} (heating was larger), so don't include it.`;
  } else if (result.motorsInCalc.some(m => m.isAc)) {
    prompt += ` The A/C motor won the ${hvacRef} comparison, so its load IS in the calculation — include it when finding the largest motor.`;
  }

  return prompt;
}

/** Generate the hint text for the largest-motor-25 step. */
export function buildMotor25Hint(result: LargestMotorResult, v: NecVersion): string {
  if (result.motorsInCalc.length === 0) return "No motors in the calculation — enter 0.";

  const hvacRef = getHvacRef(v);

  let hint = "Motors in the calculation:\n";
  hint += result.motorsInCalc.map(m => {
    const note = m.isAc ? " (from HVAC step)" : "";
    return `\u2022 ${m.name}${note}: ${m.va.toLocaleString()} VA`;
  }).join("\n");

  if (result.acExcluded) {
    hint += `\n\n(A/C excluded \u2014 heating won ${hvacRef})`;
  }

  const largest = result.motorsInCalc.reduce((max, m) => m.va > max.va ? m : max);
  hint += `\n\nLargest: ${largest.name} at ${largest.va.toLocaleString()} VA`;
  hint += `\n25% of ${largest.va.toLocaleString()} = ${result.addition.toLocaleString()} VA`;

  return hint;
}
