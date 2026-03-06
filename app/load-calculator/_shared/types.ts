// Shared types for load calculator

export type DifficultyLevel = "beginner" | "intermediate";

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
    description: "Learn with full guidance",
    features: [
      "Equipment highlighting",
      "Progress tracking (scratch-off)",
      "Quick reference tracking",
      "Step-by-step hints",
    ],
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Practice without visual aids",
    features: [
      "No equipment highlighting",
      "No progress tracking",
      "Reference available but not tracked",
      "Hints available on request",
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
  difficulty: DifficultyLevel | null;
  selectedScenario: TScenario | null;
  currentStepIndex: number;
  answers: Record<string, number>;
  userInput: string;
  showHint: boolean;
  lastAnswerCorrect: boolean | null;
  sparkyMessage: string;
  isComplete: boolean;
  manualScratchedOff: Set<string>;
  motorSubStepIndex?: number;
  motorSubStepAnswers?: Record<string, number>;
  hvacSubStepIndex?: number;
  hvacMotorVA?: number;
}

export interface SavedProgress {
  difficulty: DifficultyLevel;
  scenarioId: string;
  currentStepIndex: number;
  answers: Record<string, number>;
  isComplete: boolean;
  motorSubStepIndex?: number;
  motorSubStepAnswers?: Record<string, number>;
  hvacSubStepIndex?: number;
  hvacMotorVA?: number;
}

export interface CompletionResults {
  serviceAmps: number;
  conductorSize: string;
  gecSize: string;
  aluminumConductorSize?: string;
}
