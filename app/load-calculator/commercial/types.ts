import type { NecVersion } from "@/types/question";

export interface KitchenEquipmentItem {
  name: string;
  watts: number;
}

export interface Motor {
  name: string;
  horsepower: number;
  voltage: 120 | 208 | 240;
  phase: 1 | 3;
}

export interface CommercialScenario {
  id: string;
  name: string;
  buildingType: string;
  squareFootage: number;
  voltage: 208 | 240;
  phases: 1 | 3;
  description: string;
  difficulty: "beginner" | "intermediate" | "expert";
  // Outlet counts
  lampholders: number;
  receptacles: number;
  multioutletAssemblyFeet: number;
  showWindowFeet: number;
  hasSignOutlet: boolean;
  // Kitchen equipment
  kitchenEquipment: KitchenEquipmentItem[];
  // HVAC
  acMotor: Motor | null;
  heatWatts: number;
  // Other motors (non-HVAC)
  otherMotors: Motor[];
}

export interface CommercialCalculationStep {
  id: string;
  title: string | ((necVersion: NecVersion) => string);
  sparkyPrompt: string | ((scenario: CommercialScenario, necVersion?: NecVersion) => string);
  hint: string | ((scenario: CommercialScenario, previousAnswers: Record<string, number>, necVersion?: NecVersion) => string);
  necReference: string | ((necVersion: NecVersion) => string);
  inputType: "number" | "calculation" | "selection";
  formula?: string | ((scenario: CommercialScenario, necVersion?: NecVersion) => string);
  expectedAnswer?: (scenario: CommercialScenario, previousAnswers: Record<string, number>) => number;
  validateAnswer?: (userAnswer: number, expected: number) => boolean;
}

export interface EquipmentDisplayItem {
  id: string;
  name: string;
  value: string;
  category: "building" | "outlets" | "kitchen" | "hvac" | "motors";
}

export interface BuildingType {
  buildingType: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "mixed";
  voltage: number;
  phases: number;
  variants: CommercialScenario[];
}

export interface OutletDemandSubStep {
  receptacleBaseLoad: number;
  expectedDemand: number;
  sparkyPrompt: string;
  hint: string;
  formula: string;
  necReference: string;
}

export interface MotorSubStep {
  equipmentId: string;
  motorName: string;
  hp: number;
  voltage: number;
  phase: 1 | 3;
  expectedVA: number;
  sparkyPrompt: string;
  hint: string;
  formula: string;
  necReference: string;
}
