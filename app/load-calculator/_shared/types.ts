// Shared types for load calculator

export type DifficultyLevel = "beginner" | "intermediate" | "expert";

export interface DifficultyOption {
  id: DifficultyLevel;
  name: string;
  description: string;
  features: string[];
}

export const DIFFICULTY_LEVELS: DifficultyOption[] = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Learn the basics",
    features: [
      "Fewer loads & simpler HVAC",
      "Fewer motors",
      "Full UI guidance & hints",
    ],
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "More equipment, more challenge",
    features: [
      "Larger buildings & more loads",
      "More motors & multioutlet assemblies",
      "Full UI guidance & hints",
    ],
  },
  {
    id: "expert",
    name: "Expert",
    description: "Complex real-world scenarios",
    features: [
      "Multiple cooking appliances & Note 2",
      "Tight HVAC comparisons & large motors",
      "Full UI guidance & hints",
    ],
  },
];

export interface HvacMotorSubStep {
  motorName: string;
  hp: number;
  voltage: number;
  expectedVA: number;
  sparkyPrompt: string;
  hint: string;
  formula: string;
  necReference: string;
}

export interface CalculatorState<TScenario> {
  selectedScenario: TScenario | null;
  currentStepIndex: number;
  answers: Record<string, number>;
  userInput: string;
  showHint: boolean;
  lastAnswerCorrect: boolean | null;
  sparkyMessage: string;
  isComplete: boolean;
  motorSubStepIndex?: number;
  motorSubStepAnswers?: Record<string, number>;
  hvacSubStepIndex?: number;
  hvacMotorVA?: number;
  fixedMotorSubStepIndex?: number;
  fixedMotorVAs?: Record<string, number>;
  outletSubStepIndex?: number;
  receptacleDemandVA?: number;
}

export interface SavedProgress {
  scenarioId: string;
  currentStepIndex: number;
  answers: Record<string, number>;
  isComplete: boolean;
  motorSubStepIndex?: number;
  motorSubStepAnswers?: Record<string, number>;
  hvacSubStepIndex?: number;
  hvacMotorVA?: number;
  fixedMotorSubStepIndex?: number;
  fixedMotorVAs?: Record<string, number>;
  outletSubStepIndex?: number;
  receptacleDemandVA?: number;
}

export interface CompletionResults {
  serviceAmps: number;
  conductorSize: string;
  gecSize: string;
  aluminumConductorSize?: string;
}
