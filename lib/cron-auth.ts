// Vercel Cron authentication.
//
// Vercel sends an `Authorization: Bearer <CRON_SECRET>` header on every
// scheduled invocation. The secret is auto-set in production; in development,
// set it manually in .env.local to test cron endpoints with curl.

import { NextRequest } from "next/server";

export function verifyCronRequest(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Without CRON_SECRET set we accept all requests so local dev `curl` works.
    // In production Vercel always sets it, so this fallthrough only matters in
    // dev. Log a warning so a misconfigured prod environment is visible.
    console.warn("[cron-auth] CRON_SECRET not set — accepting cron request unauthenticated");
    return true;
  }
  const presented = request.headers.get("authorization");
  return presented === `Bearer ${expected}`;
}
