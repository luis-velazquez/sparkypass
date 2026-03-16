import { questions } from "@/data/questions";
import type { Question, CategorySlug, Difficulty, NecVersion } from "@/types/question";

/** Filter a question list by NEC version when provided. */
function filterByVersion(qs: Question[], necVersion?: NecVersion): Question[] {
  if (!necVersion) return qs;
  return qs.filter((q) => q.necVersions?.includes(necVersion));
}

/**
 * Get all questions
 */
export function getAllQuestions(necVersion?: NecVersion): Question[] {
  return filterByVersion(questions, necVersion);
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: CategorySlug, necVersion?: NecVersion): Question[] {
  return filterByVersion(
    questions.filter((q) => q.category === category),
    necVersion,
  );
}

/**
 * Get questions by difficulty
 */
export function getQuestionsByDifficulty(difficulty: Difficulty, necVersion?: NecVersion): Question[] {
  return filterByVersion(
    questions.filter((q) => q.difficulty === difficulty),
    necVersion,
  );
}

/**
 * Get questions by category and difficulty
 */
export function getQuestionsByCategoryAndDifficulty(
  category: CategorySlug,
  difficulty: Difficulty,
  necVersion?: NecVersion,
): Question[] {
  return filterByVersion(
    questions.filter((q) => q.category === category && q.difficulty === difficulty),
    necVersion,
  );
}

/**
 * Get a random selection of questions from a category, optionally filtered by difficulty
 */
export function getRandomQuestions(category: CategorySlug, count: number = 15, difficulty?: Difficulty, necVersion?: NecVersion): Question[] {
  const categoryQuestions = difficulty
    ? getQuestionsByCategoryAndDifficulty(category, difficulty, necVersion)
    : getQuestionsByCategory(category, necVersion);
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
export function getQuestionCountByCategoryAndDifficulty(category: CategorySlug, difficulty: Difficulty, necVersion?: NecVersion): number {
  return getQuestionsByCategoryAndDifficulty(category, difficulty, necVersion).length;
}

/**
 * Get a random selection of questions from ALL categories
 */
export function getRandomQuestionsAll(count: number = 5, necVersion?: NecVersion): Question[] {
  const pool = filterByVersion(questions, necVersion);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get a single question by ID (unfiltered — needed for bookmarks/saved progress)
 */
export function getQuestionById(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}

/**
 * Get question count by category
 */
export function getQuestionCountByCategory(category: CategorySlug, necVersion?: NecVersion): number {
  return getQuestionsByCategory(category, necVersion).length;
}

/**
 * Get question counts for all categories
 */
export function getCategoryCounts(necVersion?: NecVersion): Record<CategorySlug, number> {
  return {
    "calculations-and-theory": getQuestionCountByCategory("calculations-and-theory", necVersion),
    "grounding-bonding": getQuestionCountByCategory("grounding-bonding", necVersion),
    services: getQuestionCountByCategory("services", necVersion),
"box-fill": getQuestionCountByCategory("box-fill", necVersion),
    "motors-and-generators": getQuestionCountByCategory("motors-and-generators", necVersion),
    "transformer-sizing": getQuestionCountByCategory("transformer-sizing", necVersion),
    "special-occupancies": getQuestionCountByCategory("special-occupancies", necVersion),
    "wiring-methods": getQuestionCountByCategory("wiring-methods", necVersion),
  };
}

/**
 * Get total question count
 */
export function getTotalQuestionCount(necVersion?: NecVersion): number {
  return filterByVersion(questions, necVersion).length;
}
