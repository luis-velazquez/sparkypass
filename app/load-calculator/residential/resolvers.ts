import type { NecVersion } from "@/types/question";
import type { CalculationStep, HouseScenario } from "./types";

/** Resolve title — returns the string, calling the function with necVersion if needed */
export function resolveTitle(step: CalculationStep, necVersion: NecVersion = "2023"): string {
  return typeof step.title === "function" ? step.title(necVersion) : step.title;
}

/** Resolve sparkyPrompt — returns the string, calling the function if needed */
export function resolveSparkyPrompt(step: CalculationStep, scenario: HouseScenario, necVersion: NecVersion = "2023"): string {
  return typeof step.sparkyPrompt === "function" ? step.sparkyPrompt(scenario, necVersion) : step.sparkyPrompt;
}

/** Resolve necReference — returns the string, calling the function with necVersion if needed */
export function resolveNecReference(step: CalculationStep, necVersion: NecVersion = "2023"): string {
  return typeof step.necReference === "function" ? step.necReference(necVersion) : step.necReference;
}

/** Resolve formula — returns the string, calling the function if needed */
export function resolveFormula(step: CalculationStep, scenario: HouseScenario, necVersion: NecVersion = "2023"): string | undefined {
  if (step.formula === undefined) return undefined;
  return typeof step.formula === "function" ? step.formula(scenario, necVersion) : step.formula;
}
