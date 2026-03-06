import type { CategorySlug, Difficulty, NecVersion, Question } from "./question";

export interface BlueprintSection {
  name: string;
  questionCount: number;
  categorySlugs: CategorySlug[];
}

export interface ExamBlueprint {
  id: string;
  name: string;
  state: string;
  examLevel: "journeyman" | "master";
  totalQuestions: number;
  timeLimit: number; // minutes
  passingScore: number; // percentage (e.g., 70)
  source?: string;
  sections: BlueprintSection[];
}

export interface SectionReport {
  sectionName: string;
  requested: number;
  filledFromPrimary: number;
  filledFromFallback: number;
  filledFromRedistribution: number;
  shortage: number;
  categorySlugs: CategorySlug[];
}

export interface GenerationReport {
  totalRequested: number;
  totalGenerated: number;
  requestedDifficulty: Difficulty;
  necVersion?: NecVersion;
  sections: SectionReport[];
  hasShortages: boolean;
  warnings: string[];
}

export interface GeneratedExam {
  blueprint: ExamBlueprint;
  questions: Question[];
  report: GenerationReport;
  generatedAt: string;
}
