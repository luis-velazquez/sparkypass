// PUT /api/user/notification-prefs
// GET /api/user/notification-prefs
//
// Notification preferences blob, stored as JSON in users.notification_prefs.
// Used by the streak-reminder and weekly-digest crons to decide whether and
// when to send each user a push.
//
// Schema (v1):
//   {
//     dailyStreakReminder: { enabled: boolean, hour: number (0-23), minute: 0|15|30|45 },
//     weeklyDigest: { enabled: boolean }
//   }
//
// Minute restricted to 15-min increments per OQ#7 resolution.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";

const DEFAULTS = {
  dailyStreakReminder: { enabled: true, hour: 19, minute: 0 },
  weeklyDigest: { enabled: true },
};

interface NotificationPrefs {
  dailyStreakReminder: { enabled: boolean; hour: number; minute: number };
  weeklyDigest: { enabled: boolean };
}

function parsePrefs(raw: string | null): NotificationPrefs {
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      dailyStreakReminder: {
        ...DEFAULTS.dailyStreakReminder,
        ...(parsed.dailyStreakReminder ?? {}),
      },
      weeklyDigest: {
        ...DEFAULTS.weeklyDigest,
        ...(parsed.weeklyDigest ?? {}),
      },
    };
  } catch {
    return DEFAULTS;
  }
}

interface RequestBody {
  dailyStreakReminder?: { enabled?: unknown; hour?: unknown; minute?: unknown };
  weeklyDigest?: { enabled?: unknown };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  const [user] = await db
    .select({ notificationPrefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json({ prefs: parsePrefs(user?.notificationPrefs ?? null) });
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

  // Read existing so partial updates work — client can PUT just one section.
  const [existing] = await db
    .select({ notificationPrefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const current = parsePrefs(existing?.notificationPrefs ?? null);

  // Validate each provided field tightly.
  if (body.dailyStreakReminder) {
    const incoming = body.dailyStreakReminder;
    if (typeof incoming.enabled === "boolean") {
      current.dailyStreakReminder.enabled = incoming.enabled;
    }
    if (typeof incoming.hour === "number" && Number.isInteger(incoming.hour)) {
      if (incoming.hour < 0 || incoming.hour > 23) {
        return NextResponse.json(
          { error: "hour must be 0–23", code: "BAD_HOUR" },
          { status: 400 },
        );
      }
      current.dailyStreakReminder.hour = incoming.hour;
    }
    if (typeof incoming.minute === "number" && Number.isInteger(incoming.minute)) {
      if (![0, 15, 30, 45].includes(incoming.minute)) {
        return NextResponse.json(
          { error: "minute must be 0, 15, 30, or 45", code: "BAD_MINUTE" },
          { status: 400 },
        );
      }
      current.dailyStreakReminder.minute = incoming.minute;
    }
  }

  if (body.weeklyDigest && typeof body.weeklyDigest.enabled === "boolean") {
    current.weeklyDigest.enabled = body.weeklyDigest.enabled;
  }

  await db
    .update(users)
    .set({
      notificationPrefs: JSON.stringify(current),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true, prefs: current });
}
