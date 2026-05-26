// PUT /api/user/timezone
//
// Update the user's IANA timezone. Used by push-notification crons (streak
// reminder, weekly digest) and the resistance-penalties cron (runs at user's
// local 3am — OQ#4 resolution).
//
// Validates against Intl.supportedValuesOf("timeZone") so we never store a
// timezone the server can't interpret.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";

interface RequestBody {
  timezone?: unknown;
}

function isValidIANATimezone(tz: string): boolean {
  try {
    // Intl.supportedValuesOf is the canonical reference list.
    const supported = (Intl as unknown as { supportedValuesOf: (key: string) => string[] })
      .supportedValuesOf?.("timeZone");
    if (Array.isArray(supported)) return supported.includes(tz);
  } catch {
    // fall through
  }
  // Fallback: round-trip through DateTimeFormat. If the engine throws on the
  // tz, the format constructor rejects it.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const timezone = typeof body.timezone === "string" ? body.timezone.trim() : null;
  if (!timezone) {
    return NextResponse.json(
      { error: "timezone is required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }
  if (!isValidIANATimezone(timezone)) {
    return NextResponse.json(
      {
        error: "Not a valid IANA timezone name (e.g., 'America/Denver')",
        code: "BAD_TIMEZONE",
      },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({ timezone, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true, timezone });
}
