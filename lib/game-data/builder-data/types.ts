export interface FormulaStep {
  id: string;
  label: string;
  description: string;
}

export interface FormulaScenario {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  steps: FormulaStep[];
  distractors: FormulaStep[];
  explanation: string;
}

export interface FormulaPack {
  id: string;
  name: string;
  scenarios: FormulaScenario[];
}
