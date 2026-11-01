// GET /api/cron/sparky-notify
//
// Sparky's notification engine (lib/sparky-notify). Replaces the separate
// streak-reminder and weekly-digest crons. Meant to run hourly — see
// .github/workflows/sparky-notify.yml — but any cadence is safe: sends are
// keyed in notification_log, so missed runs catch up and overlapping runs
// never double-send.
//
// ?dryRun=1 returns what would be sent without sending or logging anything.

import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { runSparkyNotifications } from "@/lib/sparky-notify/run";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }
  const now = new Date();
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const summary = await runSparkyNotifications(now, { dryRun });
  console.log("[cron/sparky-notify]", { ...summary, preview: undefined, dryRun });
  return NextResponse.json({ ok: true, dryRun, ...summary, ran_at: now.toISOString() });
}
