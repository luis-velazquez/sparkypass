// Vercel Cron authentication.
//
// When a CRON_SECRET env var is set, Vercel attaches it as
// `Authorization: Bearer <CRON_SECRET>` to every scheduled cron invocation
// (it is NOT auto-generated — you must create the env var). Cron routes are
// otherwise public HTTP endpoints, so the secret is what keeps anyone on the
// internet from triggering them (mass push, quota burn, DB load).

import { NextRequest } from "next/server";

export function verifyCronRequest(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Fail CLOSED in production: a live cron route with no secret is
    // world-triggerable. Only local dev (no VERCEL env) falls open so `curl`
    // can exercise the endpoint without a secret.
    if (process.env.VERCEL) {
      console.error(
        "[cron-auth] CRON_SECRET not set in a Vercel environment — rejecting request",
      );
      return false;
    }
    console.warn(
      "[cron-auth] CRON_SECRET not set — accepting cron request unauthenticated (dev only)",
    );
    return true;
  }
  const presented = request.headers.get("authorization");
  return presented === `Bearer ${expected}`;
}
