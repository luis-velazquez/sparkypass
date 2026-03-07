import type { NecVersion } from "@/types/question";

export interface Appliance {
  id: string;
  name: string;
  watts: number;
  isRequired?: boolean; // Part of standard calculation
  necReference: string;
  // Motor-specific fields
  horsepower?: number;
  motorVoltage?: 120 | 240; // User sees 120/240, we lookup 115/230 in table
  isMotor?: boolean;
}

export interface HouseScenario {
  id: string;
  name: string;
  squareFootage: number;
  voltage: 120 | 240;
  appliances: Appliance[];
  description: string;
  difficulty: "beginner" | "intermediate" | "expert";
}

export interface CalculationStep {
  id: string;
  title: string | ((necVersion: NecVersion) => string);
  sparkyPrompt: string | ((scenario: HouseScenario, necVersion?: NecVersion) => string);
  hint: string | ((scenario: HouseScenario, previousAnswers: Record<string, number>, necVersion?: NecVersion) => string);
  necReference: string | ((necVersion: NecVersion) => string);
  inputType: "number" | "calculation" | "selection";
  formula?: string | ((scenario: HouseScenario, necVersion?: NecVersion) => string);
  expectedAnswer?: (scenario: HouseScenario, previousAnswers: Record<string, number>) => number;
  validateAnswer?: (userAnswer: number, expected: number) => boolean;
  storedAnswer?: (scenario: HouseScenario, previousAnswers: Record<string, number>, userAnswer: number) => number;
  parseInput?: (input: string) => number;
  shouldShow?: (scenario: HouseScenario) => boolean;
}
