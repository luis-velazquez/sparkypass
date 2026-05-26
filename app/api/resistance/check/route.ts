// GET /api/resistance/check
//
// On-demand resistance check (called from the web dashboard on page load).
// Mobile clients don't call this directly — the cron at /api/cron/resistance
// applies penalties at the user's local 3am instead (audit OQ#4).

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyResistanceForUser } from "@/lib/resistance";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await applyResistanceForUser(session.user.id);
  if (!result) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    penalties: result.penalties,
    newBalance: result.newBalance,
  });
}
