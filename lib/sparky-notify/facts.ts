// Loads what the rules need about a user from the database.

import { and, eq, gt, gte, lte, or, sql } from "drizzle-orm";
import { db, notificationLog, questionSrs, userProgress, wattsTransactions } from "@/lib/db";
import { getQuestionById } from "@/lib/questions";
import { CATEGORIES } from "@/types/question";
import type { SentRecord, TopicStat } from "./types";

const DAY_MS = 86_400_000;

export interface ActivityFacts {
  wattsThisWeek: number;
  answeredTotal: number;
  answeredThisWeek: number;
  correctThisWeek: number;
  answeredLastWeek: number;
  correctLastWeek: number;
  topicsThisWeek: TopicStat[];
  topicsLastWeek: TopicStat[];
  topics14d: TopicStat[];
  reviewDue: number;
}

/**
 * A few bank questions carry an older or narrower category slug. Fold the ones
 * that clearly belong to one of the app's 8 topics; any other stray slug still
 * counts toward the week's totals but not toward a topic, because the report
 * can only send people to the 8 topic quizzes.
 */
const TOPIC_ALIASES: Record<string, string> = {
  "grounding-and-bonding": "grounding-bonding",
  "load-calculations": "calculations-and-theory",
  "fire-pumps": "special-occupancies",
  "elevators-and-escalators": "special-occupancies",
};

/** Past sends that still matter: the last 30 days, plus every milestone ever. */
export async function loadHistory(userId: string, now: Date): Promise<SentRecord[]> {
  const rows = await db
    .select({
      type: notificationLog.type,
      dedupKey: notificationLog.dedupKey,
      variant: notificationLog.variant,
      sentAt: notificationLog.sentAt,
    })
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.userId, userId),
        or(gt(notificationLog.sentAt, new Date(now.getTime() - 30 * DAY_MS)), eq(notificationLog.type, "milestone")),
      ),
    );
  return rows as SentRecord[];
}

/** Accuracy per topic. Lists all 8 topics, including ones with 0 answered, so "unpracticed" can be spotted. */
function topicStats(rows: { questionId: string; isCorrect: boolean }[]): TopicStat[] {
  const byTopic = new Map<string, TopicStat>(
    CATEGORIES.map((c) => [c.slug, { slug: c.slug, name: c.name, necArticle: c.necArticle, answered: 0, correct: 0 }]),
  );
  for (const r of rows) {
    const raw = getQuestionById(r.questionId)?.category;
    const stat = raw ? byTopic.get(TOPIC_ALIASES[raw] ?? raw) : undefined;
    if (!stat) continue;
    stat.answered += 1;
    if (r.isCorrect) stat.correct += 1;
  }
  return [...byTopic.values()];
}

/** Study activity numbers. Only loaded when a coaching message could actually go out. */
export async function loadActivity(userId: string, now: Date): Promise<ActivityFacts> {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);

  const recent = await db
    .select({ questionId: userProgress.questionId, isCorrect: userProgress.isCorrect, answeredAt: userProgress.answeredAt })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), gte(userProgress.answeredAt, twoWeeksAgo)));

  const [total] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  const [watts] = await db
    .select({
      earned: sql<number>`COALESCE(SUM(CASE WHEN ${wattsTransactions.amount} > 0 THEN ${wattsTransactions.amount} ELSE 0 END), 0)`,
    })
    .from(wattsTransactions)
    .where(and(eq(wattsTransactions.userId, userId), gte(wattsTransactions.createdAt, weekAgo)));

  const [due] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(questionSrs)
    .where(and(eq(questionSrs.userId, userId), lte(questionSrs.nextReviewDate, now)));

  const thisWeek = recent.filter((r: { answeredAt: Date }) => r.answeredAt >= weekAgo);
  const lastWeek = recent.filter((r: { answeredAt: Date }) => r.answeredAt < weekAgo);
  const correct = (rows: { isCorrect: boolean }[]) => rows.filter((r) => r.isCorrect).length;

  return {
    wattsThisWeek: Number(watts?.earned ?? 0),
    answeredTotal: Number(total?.n ?? 0),
    answeredThisWeek: thisWeek.length,
    correctThisWeek: correct(thisWeek),
    answeredLastWeek: lastWeek.length,
    correctLastWeek: correct(lastWeek),
    topicsThisWeek: topicStats(thisWeek),
    topicsLastWeek: topicStats(lastWeek),
    topics14d: topicStats(recent),
    reviewDue: Number(due?.n ?? 0),
  };
}
