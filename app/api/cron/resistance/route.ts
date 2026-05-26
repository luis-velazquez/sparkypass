// GET /api/cron/resistance
//
// Vercel Cron — hourly (vercel.json). For each user whose IANA timezone makes
// "now" land in the 03:00 local hour, apply resistance penalties via the
// shared helper. The helper is idempotent per-day, so re-runs within the same
// local day are no-ops.
//
// Why 3am: outside active study hours, so a notification of penalty doesn't
// surprise a user mid-quiz. Most users are asleep; they see the adjusted
// balance on their next foreground.

import { NextRequest, NextResponse } from "next/server";
import { eq, isNotNull, isNull, and } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { applyResistanceForUser } from "@/lib/resistance";
import { verifyCronRequest } from "@/lib/cron-auth";

function userLocalHour(tz: string, now: Date): number | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: tz,
    });
    const part = fmt.formatToParts(now).find((p) => p.type === "hour");
    const hour = Number.parseInt(part?.value ?? "", 10);
    return Number.isInteger(hour) ? hour : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();

  // Pull all timezones currently configured. SQLite can't filter by timezone-
  // dependent local hour, so we filter in JS. The candidate set is bounded by
  // the size of the active user base — small enough at v1 to iterate in
  // memory.
  const rows = await db
    .select({
      id: users.id,
      timezone: users.timezone,
    })
    .from(users)
    .where(and(isNotNull(users.timezone), isNull(users.deletedAt)));

  let processed = 0;
  let applied = 0;
  let skippedNoMatch = 0;
  let skippedAlreadyDone = 0;

  for (const u of rows) {
    if (!u.timezone) continue;
    const hour = userLocalHour(u.timezone, now);
    if (hour !== 3) {
      skippedNoMatch++;
      continue;
    }
    const result = await applyResistanceForUser(u.id);
    processed++;
    if (result?.alreadyCheckedToday) {
      skippedAlreadyDone++;
    } else if (result?.applied) {
      applied++;
    }

    // Note: we deliberately do NOT push the user about a Watts deduction.
    // Surprise notifications about lost points violate the "don't punish via
    // push" principle. The user sees the adjusted balance + a transaction
    // entry on next foreground.
  }

  console.log("[cron/resistance]", {
    candidates: rows.length,
    processed,
    applied,
    skippedNoMatch,
    skippedAlreadyDone,
  });

  return NextResponse.json({
    ok: true,
    candidates: rows.length,
    processed,
    applied,
    skippedNoMatch,
    skippedAlreadyDone,
    ran_at: now.toISOString(),
  });
}
