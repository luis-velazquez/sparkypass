import type { Difficulty, ExamTopic, NecVersion, Question } from "./question";

export type ExamType = "knowledge" | "calculations";
export type ExamLevel = "journeyman" | "master";

export interface ExamTopicRequirement {
  topic: ExamTopic;
  count: number;
  /** Fallback topics if there aren't enough questions for this topic */
  fallback?: ExamTopic[];
}

export interface ExamConfig {
  id: string;
  name: string;
  level: ExamLevel;
  type: ExamType;
  totalQuestions: number;
  passingScore: number; // number of correct answers to pass
  passingPercent: number;
  timeLimit: number; // minutes
  /** Only pull questions where calculation matches this. null = no filter */
  calculationFilter: boolean | null;
  /** Which difficulty levels to pull from */
  difficulties: Difficulty[];
  /** Topic breakdown — how many questions per exam topic */
  topics: ExamTopicRequirement[];
}

export interface TopicResult {
  topic: ExamTopic;
  requested: number;
  filled: number;
  correct: number;
}

export interface GeneratedExam {
  config: ExamConfig;
  questions: Question[];
  generatedAt: string;
  warnings: string[];
}
