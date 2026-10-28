// POST /api/auth/mobile/change-password
//
// Authenticated password change (native-auth PRD US-004). Requires the
// current password; on success revokes refresh tokens on every OTHER device
// (the device that performed the change keeps its session — deviceId tells
// us which one that is). Apple/Google-only accounts have no password and get
// a friendly pointer to the reset flow, which can set one.

import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { revokeAllRefreshTokensForUser } from "@/lib/auth-mobile";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const changeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

interface RequestBody {
  currentPassword?: unknown;
  newPassword?: unknown;
  deviceId?: unknown;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  const { success } = changeLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": "900" } },
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

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : null;
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : null;
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;

  if (!currentPassword || !newPassword || !deviceId) {
    return NextResponse.json(
      {
        error: "currentPassword, newPassword, and deviceId are required",
        code: "MISSING_FIELDS",
      },
      { status: 400 },
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters", code: "WEAK_PASSWORD" },
      { status: 400 },
    );
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error:
          "This account signs in with Apple or Google and has no password. Use \"Forgot password\" to set one.",
        code: "NO_PASSWORD",
      },
      { status: 400 },
    );
  }

  const isValid = await compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect", code: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  const passwordHash = await hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Evict every other device; the one that proved the current password stays.
  await revokeAllRefreshTokensForUser(user.id, deviceId);

  return NextResponse.json({ success: true });
}
