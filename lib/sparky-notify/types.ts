import type { NotificationTypeValue } from "@/lib/db/schema";
import type { NotificationPrefs } from "./prefs";

export type NotificationType = NotificationTypeValue;

/** Accuracy for one topic over a time window. */
export interface TopicStat {
  slug: string;
  name: string;
  necArticle: string;
  answered: number;
  correct: number;
}

/** Everything the rules and templates need about one user. Built by facts.ts. */
export interface UserFacts {
  userId: string;
  firstName: string | null;
  timezone: string;
  prefs: NotificationPrefs;
  studyStreak: number;
  lastStudyAt: Date | null;
  targetExamDate: Date | null;
  wattsLifetime: number;
  wattsThisWeek: number;
  answeredTotal: number;
  answeredThisWeek: number;
  correctThisWeek: number;
  answeredLastWeek: number;
  correctLastWeek: number;
  /** Per-topic accuracy, last 7 days. */
  topicsThisWeek: TopicStat[];
  /** Per-topic accuracy, last 14 days (weak-spot detection). */
  topics14d: TopicStat[];
  /** Spaced-repetition questions past their review date. */
  reviewDue: number;
}

/** A past send, from notification_log. */
export interface SentRecord {
  type: NotificationType;
  dedupKey: string | null;
  variant: number;
  sentAt: Date;
}

/** What the rules decided to send; templates turn it into words. */
export type Candidate =
  | { type: "streak_saver"; dedupKey: string; streak: number }
  | { type: "exam_countdown"; dedupKey: string; daysLeft: number; weakTopic: TopicStat | null }
  | { type: "milestone"; dedupKey: string; kind: "rank"; rankTitle: string }
  | { type: "milestone"; dedupKey: string; kind: "streak"; days: number }
  | { type: "milestone"; dedupKey: string; kind: "questions"; count: number }
  | {
      type: "weekly_report";
      dedupKey: string;
      answered: number;
      pct: number;
      /** Accuracy change vs last week in points, or null when last week is too thin to compare. */
      deltaPct: number | null;
      bestTopic: TopicStat | null;
      streak: number;
      watts: number;
    }
  | { type: "weak_spot"; dedupKey: string; topic: TopicStat }
  | { type: "review_due"; dedupKey: string; count: number }
  | { type: "comeback"; dedupKey: string; daysAway: number };

/** A message ready to push. */
export interface SparkyMessage {
  title: string;
  body: string;
  /** Sparky pose the app can show when the notification opens it. */
  pose: string;
  /** Screen the tap opens (expo-router path). */
  route: string;
  variant: number;
}
