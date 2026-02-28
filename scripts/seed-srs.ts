/**
 * SRS Seeding Script
 *
 * Populates the question_srs table from existing userProgress history.
 * For each unique user+question pair, it replays the attempt history
 * through the SM-2 algorithm to derive the initial SRS state.
 *
 * Usage:
 *   npx tsx scripts/seed-srs.ts
 *
 * Safe to run multiple times — skips questions that already have SRS records.
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { seedSRSFromHistory } from "../lib/spaced-repetition";
import path from "path";
import crypto from "crypto";

const dbPath = path.join(process.cwd(), "sparkypass.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function main() {
  console.log("Starting SRS seeding...\n");

  // Get all unique user IDs
  const userRows = await db
    .select({ id: schema.users.id })
    .from(schema.users);

  console.log(`Found ${userRows.length} users\n`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const user of userRows) {
    // Get all progress records for this user
    const progress = await db
      .select({
        questionId: schema.userProgress.questionId,
        isCorrect: schema.userProgress.isCorrect,
        answeredAt: schema.userProgress.answeredAt,
      })
      .from(schema.userProgress)
      .where(eq(schema.userProgress.userId, user.id))
      .orderBy(sql`${schema.userProgress.answeredAt} ASC`);

    if (progress.length === 0) continue;

    // Group by question ID
    const byQuestion: Record<string, Array<{ isCorrect: boolean; answeredAt: Date }>> = {};
    for (const p of progress) {
      if (!byQuestion[p.questionId]) {
        byQuestion[p.questionId] = [];
      }
      byQuestion[p.questionId].push({
        isCorrect: p.isCorrect,
        answeredAt: p.answeredAt,
      });
    }

    const questionIds = Object.keys(byQuestion);

    // Check which questions already have SRS records
    const existingSrs = await db
      .select({ questionId: schema.questionSrs.questionId })
      .from(schema.questionSrs)
      .where(eq(schema.questionSrs.userId, user.id));

    const existingSet = new Set(existingSrs.map((s) => s.questionId));

    let userCreated = 0;

    for (const questionId of questionIds) {
      if (existingSet.has(questionId)) {
        totalSkipped++;
        continue;
      }

      const attempts = byQuestion[questionId];
      const srsState = seedSRSFromHistory(attempts);

      await db.insert(schema.questionSrs).values({
        id: crypto.randomUUID(),
        userId: user.id,
        questionId,
        easeFactor: srsState.easeFactor,
        interval: srsState.interval,
        repetitions: srsState.repetitions,
        nextReviewDate: srsState.nextReviewDate,
        lastReviewDate: attempts[attempts.length - 1].answeredAt,
        timesCorrect: srsState.timesCorrect,
        timesWrong: srsState.timesWrong,
      });

      userCreated++;
      totalCreated++;
    }

    if (userCreated > 0) {
      console.log(`  User ${user.id}: seeded ${userCreated} questions (${questionIds.length - userCreated} already existed)`);
    }
  }

  console.log(`\nDone! Created ${totalCreated} SRS records, skipped ${totalSkipped} existing.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
