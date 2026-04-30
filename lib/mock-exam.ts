import type { ExamConfig, ExamTopicRequirement, GeneratedExam } from "@/types/mock-exam";
import type { Question, ExamTopic, NecVersion } from "@/types/question";
import { questions } from "@/data/questions";

// ─── Exam Configurations ────────────────────────────────────────────────────

export const EXAM_CONFIGS: ExamConfig[] = [
  // ── Journeyman Knowledge ──────────────────────────────────────────────
  {
    id: "journeyman-knowledge",
    name: "Journeyman Knowledge",
    level: "journeyman",
    type: "knowledge",
    totalQuestions: 56,
    passingScore: 40,
    passingPercent: 71,
    timeLimit: 150,
    calculationFilter: false,
    difficulties: ["journeyman"],
    topics: [
      { topic: "definitions-theory", count: 3 },
      { topic: "services-sds", count: 6 },
      { topic: "feeders", count: 3 },
      { topic: "branch-circuits", count: 10 },
      { topic: "wiring-methods", count: 10 },
      { topic: "equipment-devices", count: 10 },
      { topic: "motors-generators", count: 5 },
      { topic: "control-disconnect", count: 1 },
      { topic: "special-occupancies", count: 6 },
      { topic: "renewable-energy", count: 2, fallback: ["special-occupancies", "wiring-methods"] },
    ],
  },

  // ── Journeyman Calculations ───────────────────────────────────────────
  {
    id: "journeyman-calculations",
    name: "Journeyman Calculations",
    level: "journeyman",
    type: "calculations",
    totalQuestions: 24,
    passingScore: 17,
    passingPercent: 71,
    timeLimit: 170,
    calculationFilter: true,
    difficulties: ["journeyman"],
    topics: [
      { topic: "calc-theory", count: 2 },
      { topic: "services-sds", count: 4 },
      { topic: "feeders", count: 3 },
      { topic: "branch-circuits", count: 4 },
      { topic: "wiring-methods", count: 2 },
      { topic: "equipment-devices", count: 2 },
      { topic: "motors-generators", count: 1 },
      { topic: "control-disconnect", count: 2, fallback: ["motors-generators", "equipment-devices"] },
      { topic: "special-occupancies", count: 3 },
      { topic: "renewable-energy", count: 1, fallback: ["special-occupancies", "calc-theory"] },
    ],
  },

  // ── Master Knowledge ──────────────────────────────────────────────────
  {
    id: "master-knowledge",
    name: "Master Knowledge",
    level: "master",
    type: "knowledge",
    totalQuestions: 70,
    passingScore: 49,
    passingPercent: 70,
    timeLimit: 150,
    calculationFilter: false,
    difficulties: ["master", "journeyman"],
    topics: [
      { topic: "definitions-theory", count: 7 },
      { topic: "services-sds", count: 11 },
      { topic: "feeders", count: 7 },
      { topic: "branch-circuits", count: 11 },
      { topic: "wiring-methods", count: 7 },
      { topic: "equipment-devices", count: 7 },
      { topic: "motors-generators", count: 7 },
      { topic: "control-disconnect", count: 3 },
      { topic: "special-occupancies", count: 7 },
      { topic: "renewable-energy", count: 3, fallback: ["special-occupancies", "wiring-methods"] },
    ],
  },

  // ── Master Calculations ───────────────────────────────────────────────
  {
    id: "master-calculations",
    name: "Master Calculations",
    level: "master",
    type: "calculations",
    totalQuestions: 30,
    passingScore: 21,
    passingPercent: 70,
    timeLimit: 170,
    calculationFilter: true,
    difficulties: ["master", "journeyman"],
    topics: [
      { topic: "calc-theory", count: 2 },
      { topic: "services-sds", count: 8 },
      { topic: "feeders", count: 3 },
      { topic: "branch-circuits", count: 4 },
      { topic: "wiring-methods", count: 2 },
      { topic: "equipment-devices", count: 2 },
      { topic: "motors-generators", count: 6 },
      { topic: "control-disconnect", count: 1, fallback: ["motors-generators"] },
      { topic: "special-occupancies", count: 1 },
      { topic: "renewable-energy", count: 1, fallback: ["special-occupancies", "calc-theory"] },
    ],
  },
];

export function getExamConfig(examId: string): ExamConfig | undefined {
  return EXAM_CONFIGS.find((c) => c.id === examId);
}

export function getExamsByLevel(level: "journeyman" | "master"): ExamConfig[] {
  return EXAM_CONFIGS.filter((c) => c.level === level);
}

// ─── Exam Generator ─────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build a filtered pool of questions matching the exam constraints.
 */
function buildPool(
  config: ExamConfig,
  topic: ExamTopic,
  necVersion?: NecVersion,
): Question[] {
  let pool = questions.filter((q) => {
    // Match exam topic
    if (q.examTopic !== topic) return false;
    // Match difficulty
    if (!config.difficulties.includes(q.difficulty)) return false;
    // Match calculation filter
    if (config.calculationFilter !== null && q.calculation !== config.calculationFilter) return false;
    // Match NEC version
    if (necVersion && q.necVersions && !q.necVersions.includes(necVersion)) return false;
    return true;
  });
  return shuffle(pool);
}

/**
 * Generate a mock exam by pulling the exact number of questions per topic
 * as defined in the exam config.
 */
export function generateMockExam(
  config: ExamConfig,
  necVersion?: NecVersion,
): GeneratedExam {
  const usedIds = new Set<string>();
  const warnings: string[] = [];
  const allQuestions: Question[] = [];

  for (const topicReq of config.topics) {
    let drawn: Question[] = [];

    // Primary: pull from the exact topic
    const primaryPool = buildPool(config, topicReq.topic, necVersion);
    for (const q of primaryPool) {
      if (drawn.length >= topicReq.count) break;
      if (!usedIds.has(q.id)) {
        drawn.push(q);
        usedIds.add(q.id);
      }
    }

    // Fallback: if not enough, try fallback topics
    if (drawn.length < topicReq.count && topicReq.fallback) {
      for (const fallbackTopic of topicReq.fallback) {
        if (drawn.length >= topicReq.count) break;
        const fallbackPool = buildPool(config, fallbackTopic, necVersion);
        for (const q of fallbackPool) {
          if (drawn.length >= topicReq.count) break;
          if (!usedIds.has(q.id)) {
            drawn.push(q);
            usedIds.add(q.id);
          }
        }
      }
    }

    // Last resort: relax calculation filter
    if (drawn.length < topicReq.count) {
      const relaxedPool = shuffle(
        questions.filter((q) =>
          q.examTopic === topicReq.topic &&
          config.difficulties.includes(q.difficulty) &&
          !usedIds.has(q.id) &&
          (!necVersion || !q.necVersions || q.necVersions.includes(necVersion))
        )
      );
      for (const q of relaxedPool) {
        if (drawn.length >= topicReq.count) break;
        drawn.push(q);
        usedIds.add(q.id);
      }
    }

    if (drawn.length < topicReq.count) {
      warnings.push(`${topicReq.topic}: got ${drawn.length}/${topicReq.count} questions`);
    }

    allQuestions.push(...drawn);
  }

  return {
    config,
    questions: shuffle(allQuestions),
    generatedAt: new Date().toISOString(),
    warnings,
  };
}

// ─── Topic Display Names ────────────────────────────────────────────────────

export const EXAM_TOPIC_LABELS: Record<ExamTopic, string> = {
  "calc-theory": "Calculations and Theory",
  "definitions-theory": "Definitions, Theory, and Plans",
  "services-sds": "Services, Service Equipment & SDS",
  "feeders": "Electrical Feeders",
  "branch-circuits": "Branch Circuits and Conductors",
  "wiring-methods": "Wiring Methods and Electrical Materials",
  "equipment-devices": "Electrical Equipment and Devices",
  "motors-generators": "Motors and Generators",
  "control-disconnect": "Control Devices and Disconnecting Means",
  "special-occupancies": "Special Occupancies, Equipment & Conditions",
  "renewable-energy": "Renewable Energy Technologies",
};
