import questionsData from "@/data/questions.json";
import type { Question, CategorySlug, Difficulty } from "@/types/question";

// Type assertion for imported JSON data
const questions = questionsData.questions as Question[];

/**
 * Get all questions
 */
export function getAllQuestions(): Question[] {
  return questions;
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: CategorySlug): Question[] {
  return questions.filter((q) => q.category === category);
}

/**
 * Get questions by difficulty
 */
export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return questions.filter((q) => q.difficulty === difficulty);
}

/**
 * Get questions by category and difficulty
 */
export function getQuestionsByCategoryAndDifficulty(
  category: CategorySlug,
  difficulty: Difficulty
): Question[] {
  return questions.filter((q) => q.category === category && q.difficulty === difficulty);
}

/**
 * Get a random selection of questions from a category, optionally filtered by difficulty
 */
export function getRandomQuestions(category: CategorySlug, count: number = 15, difficulty?: Difficulty): Question[] {
  const categoryQuestions = difficulty
    ? getQuestionsByCategoryAndDifficulty(category, difficulty)
    : getQuestionsByCategory(category);
  // Fisher-Yates shuffle for uniform randomization
  const shuffled = [...categoryQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get question count by category and difficulty
 */
export function getQuestionCountByCategoryAndDifficulty(category: CategorySlug, difficulty: Difficulty): number {
  return getQuestionsByCategoryAndDifficulty(category, difficulty).length;
}

/**
 * Get a random selection of questions from ALL categories
 */
export function getRandomQuestionsAll(count: number = 5): Question[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get a single question by ID
 */
export function getQuestionById(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}

/**
 * Get question count by category
 */
export function getQuestionCountByCategory(category: CategorySlug): number {
  return getQuestionsByCategory(category).length;
}

/**
 * Get question counts for all categories
 */
export function getCategoryCounts(): Record<CategorySlug, number> {
  return {
    "load-calculations": getQuestionCountByCategory("load-calculations"),
    "grounding-bonding": getQuestionCountByCategory("grounding-bonding"),
    services: getQuestionCountByCategory("services"),
    "textbook-navigation": getQuestionCountByCategory("textbook-navigation"),
    "chapter-9-tables": getQuestionCountByCategory("chapter-9-tables"),
    "box-fill": getQuestionCountByCategory("box-fill"),
    "conduit-fill": getQuestionCountByCategory("conduit-fill"),
    "voltage-drop": getQuestionCountByCategory("voltage-drop"),
    "motor-calculations": getQuestionCountByCategory("motor-calculations"),
    "temperature-correction": getQuestionCountByCategory("temperature-correction"),
    "resistance": getQuestionCountByCategory("resistance"),
    "transformer-sizing": getQuestionCountByCategory("transformer-sizing"),
  };
}

/**
 * Get total question count
 */
export function getTotalQuestionCount(): number {
  return questions.length;
}
