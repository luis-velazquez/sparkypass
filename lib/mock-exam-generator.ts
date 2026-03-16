import { getQuestionsByCategoryAndDifficulty } from "./questions";
import { CATEGORIES } from "@/types/question";
import type { CategorySlug, Difficulty, NecVersion, Question } from "@/types/question";
import type {
  ExamBlueprint,
  GeneratedExam,
  GenerationReport,
  SectionReport,
} from "@/types/mock-exam";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function drawQuestions(
  pool: Question[],
  count: number,
  usedIds: Set<string>,
): Question[] {
  const drawn: Question[] = [];
  for (const q of pool) {
    if (drawn.length >= count) break;
    if (!usedIds.has(q.id)) {
      drawn.push(q);
      usedIds.add(q.id);
    }
  }
  return drawn;
}

/** Build a shuffled pool of questions for given categories and difficulties. */
function buildPool(
  categorySlugs: CategorySlug[],
  difficulties: Difficulty[],
  necVersion?: NecVersion,
): Question[] {
  const questions: Question[] = [];
  for (const slug of categorySlugs) {
    for (const diff of difficulties) {
      questions.push(
        ...getQuestionsByCategoryAndDifficulty(slug, diff, necVersion),
      );
    }
  }
  return shuffle(questions);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_SLUGS = new Set<string>(CATEGORIES.map((c) => c.slug));

export function validateBlueprint(
  blueprint: ExamBlueprint,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!blueprint.sections.length) {
    errors.push("Blueprint has no sections.");
  }

  const sectionTotal = blueprint.sections.reduce(
    (sum, s) => sum + s.questionCount,
    0,
  );
  if (sectionTotal !== blueprint.totalQuestions) {
    errors.push(
      `Section question counts sum to ${sectionTotal}, but totalQuestions is ${blueprint.totalQuestions}.`,
    );
  }

  for (const section of blueprint.sections) {
    if (section.questionCount <= 0) {
      errors.push(`Section "${section.name}" has questionCount <= 0.`);
    }
    if (!section.categorySlugs.length) {
      errors.push(`Section "${section.name}" has no categorySlugs.`);
    }
    for (const slug of section.categorySlugs) {
      if (!VALID_SLUGS.has(slug)) {
        errors.push(
          `Section "${section.name}" references unknown category "${slug}".`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generate a mock exam from a blueprint.
 *
 * Each section can define its own `difficulties` array (e.g. ["journeyman"]
 * or ["journeyman", "master"]). The global `difficulty` param is used as a
 * fallback for sections that don't specify their own.
 */
export function generateMockExam(
  blueprint: ExamBlueprint,
  difficulty: Difficulty,
  necVersion?: NecVersion,
): GeneratedExam {
  const warnings: string[] = [];

  // Validate first
  const { valid, errors } = validateBlueprint(blueprint);
  if (!valid) {
    warnings.push(...errors.map((e) => `Validation: ${e}`));
  }

  const usedIds = new Set<string>();
  const sectionResults: {
    questions: Question[];
    report: SectionReport;
  }[] = [];

  // Phase 1: Primary fill — each section uses its own difficulties
  for (const section of blueprint.sections) {
    const sectionDifficulties = section.difficulties ?? [difficulty];
    const pool = buildPool(section.categorySlugs, sectionDifficulties, necVersion);
    const drawn = drawQuestions(pool, section.questionCount, usedIds);

    sectionResults.push({
      questions: drawn,
      report: {
        sectionName: section.name,
        requested: section.questionCount,
        filledFromPrimary: drawn.length,
        filledFromFallback: 0,
        filledFromRedistribution: 0,
        shortage: section.questionCount - drawn.length,
        categorySlugs: section.categorySlugs,
      },
    });
  }

  // Phase 2: Redistribution — fill shortages from any remaining questions
  const shortSections = sectionResults.filter((r) => r.report.shortage > 0);
  if (shortSections.length > 0) {
    // Collect all difficulties used across the blueprint
    const allDifficulties = new Set<Difficulty>();
    for (const section of blueprint.sections) {
      for (const d of section.difficulties ?? [difficulty]) {
        allDifficulties.add(d);
      }
    }

    // Gather all remaining unused questions from any category/difficulty
    const allSlugs = new Set<CategorySlug>();
    for (const section of blueprint.sections) {
      for (const slug of section.categorySlugs) {
        allSlugs.add(slug);
      }
    }

    const remaining = buildPool(
      [...allSlugs],
      [...allDifficulties],
      necVersion,
    ).filter((q) => !usedIds.has(q.id));

    for (const result of shortSections) {
      const drawn = drawQuestions(remaining, result.report.shortage, usedIds);
      result.questions.push(...drawn);
      result.report.filledFromRedistribution = drawn.length;
      result.report.shortage -= drawn.length;

      if (result.report.shortage > 0) {
        warnings.push(
          `Section "${result.report.sectionName}": ${result.report.shortage} question(s) short.`,
        );
      }
    }
  }

  // Phase 3: Shuffle & assemble
  const allQuestions = shuffle(sectionResults.flatMap((r) => r.questions));
  const totalGenerated = allQuestions.length;
  const hasShortages = sectionResults.some((r) => r.report.shortage > 0);

  if (totalGenerated < blueprint.totalQuestions) {
    warnings.push(
      `Generated ${totalGenerated} of ${blueprint.totalQuestions} requested questions.`,
    );
  }

  const report: GenerationReport = {
    totalRequested: blueprint.totalQuestions,
    totalGenerated,
    requestedDifficulty: difficulty,
    necVersion,
    sections: sectionResults.map((r) => r.report),
    hasShortages,
    warnings,
  };

  return {
    blueprint,
    questions: allQuestions,
    report,
    generatedAt: new Date().toISOString(),
  };
}
