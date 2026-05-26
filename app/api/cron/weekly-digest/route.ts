// GET /api/cron/weekly-digest
//
// Vercel Cron — Sunday 14:00 UTC (vercel.json). For users with weeklyDigest
// enabled and a push token, send a one-line summary of the prior 7 days:
// total questions answered, accuracy %, current voltage tier.
//
// The 14:00-UTC slot is a reasonable Sunday-morning compromise across US time
// zones (06:00 PT → 10:00 ET, roughly the start-of-day notification slot for
// most North-American electricians). Per-user timezone tailoring is overkill
// for v1 — the digest fires once a week, not on a precise minute.

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, isNull, sql } from "drizzle-orm";
import {
  db,
  users,
  userProgress,
  pushTokens,
} from "@/lib/db";
import { sendPushNotifications, tokensForUser } from "@/lib/push";
import { verifyCronRequest } from "@/lib/cron-auth";

interface NotificationPrefs {
  weeklyDigest?: { enabled?: boolean };
}

function parsePrefs(raw: string | null): NotificationPrefs {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as NotificationPrefs;
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const candidates = await db
    .selectDistinct({
      id: users.id,
      notificationPrefs: users.notificationPrefs,
      level: users.level,
      studyStreak: users.studyStreak,
    })
    .from(users)
    .innerJoin(pushTokens, eq(pushTokens.userId, users.id))
    .where(isNull(users.deletedAt));

  let queued = 0;
  let skippedDisabled = 0;
  let skippedNoActivity = 0;

  const sendQueue: Array<{
    tokens: string[];
    answered: number;
    correct: number;
    voltageTier: number;
    streak: number;
  }> = [];

  for (const u of candidates) {
    const prefs = parsePrefs(u.notificationPrefs).weeklyDigest;
    if (!prefs || prefs.enabled === false) {
      skippedDisabled++;
      continue;
    }

    // Aggregate last-7-day progress in one query per user. SQL count + sum is
    // cheap; the row count is bounded by ~7 days of attempts per user.
    const [stats] = await db
      .select({
        answered: sql<number>`COUNT(*)`.as("answered"),
        correct: sql<number>`SUM(CASE WHEN ${userProgress.isCorrect} THEN 1 ELSE 0 END)`.as("correct"),
      })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, u.id),
          gte(userProgress.answeredAt, oneWeekAgo),
        ),
      );

    const answered = Number(stats?.answered ?? 0);
    const correct = Number(stats?.correct ?? 0);
    if (answered === 0) {
      // Don't spam inactive users with empty digests. A separate winback
      // notification could target them later (v1.1).
      skippedNoActivity++;
      continue;
    }

    const tokens = await tokensForUser(u.id);
    if (tokens.length === 0) continue;

    sendQueue.push({
      tokens,
      answered,
      correct,
      voltageTier: u.level ?? 1,
      streak: u.studyStreak ?? 0,
    });
    queued++;
  }

  const messages = sendQueue.flatMap(({ tokens, answered, correct, voltageTier, streak }) => {
    const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const streakLine = streak > 0 ? ` · ${streak}-day streak` : "";
    return tokens.map((token) => ({
      to: token,
      title: "Your week with Sparky ⚡",
      body: `${answered} questions · ${pct}% accuracy · Voltage tier ${voltageTier}${streakLine}`,
      data: { type: "weekly-digest", answered, correct, pct, voltageTier },
      sound: "default" as const,
    }));
  });

  const result = await sendPushNotifications(messages);

  console.log("[cron/weekly-digest]", {
    candidates: candidates.length,
    queued,
    skippedDisabled,
    skippedNoActivity,
    pushResult: result,
  });

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    queued,
    skippedDisabled,
    skippedNoActivity,
    push: result,
    ran_at: now.toISOString(),
  });
}
