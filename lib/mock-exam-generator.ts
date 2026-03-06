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

function getFallbackDifficulty(primary: Difficulty): Difficulty {
  return primary === "journeyman" ? "master" : "journeyman";
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

  // Phase 1: Build category pools (shuffled)
  const allSlugs = new Set<CategorySlug>();
  for (const section of blueprint.sections) {
    for (const slug of section.categorySlugs) {
      allSlugs.add(slug);
    }
  }

  const primaryPools = new Map<CategorySlug, Question[]>();
  const fallbackPools = new Map<CategorySlug, Question[]>();
  const fallbackDifficulty = getFallbackDifficulty(difficulty);

  for (const slug of allSlugs) {
    primaryPools.set(
      slug,
      shuffle(getQuestionsByCategoryAndDifficulty(slug, difficulty, necVersion)),
    );
    // Only use journeyman/master as fallback, never apprentice
    if (fallbackDifficulty !== "apprentice") {
      fallbackPools.set(
        slug,
        shuffle(
          getQuestionsByCategoryAndDifficulty(slug, fallbackDifficulty, necVersion),
        ),
      );
    }
  }

  const usedIds = new Set<string>();
  const sectionResults: {
    questions: Question[];
    report: SectionReport;
  }[] = [];

  // Phase 2: Primary fill
  for (const section of blueprint.sections) {
    const pool = shuffle(
      section.categorySlugs.flatMap((slug) => primaryPools.get(slug) ?? []),
    );
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

  // Phase 3: Fallback fill
  for (let i = 0; i < sectionResults.length; i++) {
    const result = sectionResults[i];
    if (result.report.shortage <= 0) continue;

    const section = blueprint.sections[i];
    const pool = shuffle(
      section.categorySlugs.flatMap((slug) => fallbackPools.get(slug) ?? []),
    );
    const drawn = drawQuestions(pool, result.report.shortage, usedIds);
    result.questions.push(...drawn);
    result.report.filledFromFallback = drawn.length;
    result.report.shortage -= drawn.length;
  }

  // Phase 4: Redistribution
  const shortSections = sectionResults.filter((r) => r.report.shortage > 0);
  if (shortSections.length > 0) {
    // Gather all remaining unused questions from any pool
    const allRemaining: Question[] = [];
    for (const pool of primaryPools.values()) {
      for (const q of pool) {
        if (!usedIds.has(q.id)) allRemaining.push(q);
      }
    }
    for (const pool of fallbackPools.values()) {
      for (const q of pool) {
        if (!usedIds.has(q.id)) allRemaining.push(q);
      }
    }
    const shuffledRemaining = shuffle(allRemaining);

    for (const result of shortSections) {
      const drawn = drawQuestions(
        shuffledRemaining,
        result.report.shortage,
        usedIds,
      );
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

  // Phase 5: Shuffle & assemble
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
