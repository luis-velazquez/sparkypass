// POST /api/auth/mobile/reset-password
//
// Complete the in-app password reset (native-auth PRD US-003): consume the
// 6-digit code from /api/auth/mobile/forgot-password and set the new
// password. Succeeding also marks the email verified (the code proves inbox
// ownership) and revokes every refresh token — all devices must sign in
// fresh with the new password. No tokens are returned; the app routes to the
// login screen.

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { revokeAllRefreshTokensForUser } from "@/lib/auth-mobile";
import { consumeAuthCode } from "@/lib/auth-codes";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Generous — the per-code attempts counter (5) is the real guard.
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

interface RequestBody {
  email?: unknown;
  code?: unknown;
  newPassword?: unknown;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = resetLimiter.check(ip);
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

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : null;
  const code = typeof body.code === "string" ? body.code.trim() : null;
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : null;

  if (!email || !code || !newPassword) {
    return NextResponse.json(
      { error: "email, code, and newPassword are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters", code: "WEAK_PASSWORD" },
      { status: 400 },
    );
  }

  const result = await consumeAuthCode(email, "password_reset", code);
  if (!result.ok) {
    switch (result.reason) {
      case "invalid":
        return NextResponse.json(
          {
            error: "That code isn't right. Check the email and try again.",
            code: "INVALID_CODE",
            attemptsRemaining: result.attemptsRemaining,
          },
          { status: 400 },
        );
      case "attempts_exceeded":
        return NextResponse.json(
          { error: "Too many wrong guesses. Request a new code.", code: "ATTEMPTS_EXCEEDED" },
          { status: 400 },
        );
      case "expired":
      case "not_found":
        return NextResponse.json(
          { error: "That code has expired. Request a new one.", code: "CODE_EXPIRED" },
          { status: 400 },
        );
    }
  }

  const [user] = await db
    .select({ id: users.id, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, result.userId))
    .limit(1);

  if (!user || user.deletedAt) {
    return NextResponse.json(
      { error: "That code has expired. Request a new one.", code: "CODE_EXPIRED" },
      { status: 400 },
    );
  }

  const passwordHash = await hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash, emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Sign out everywhere — anyone holding a session on the old password
  // (including a potential attacker who forced the reset) is evicted.
  await revokeAllRefreshTokensForUser(user.id);

  return NextResponse.json({
    success: true,
    message: "Password updated. Sign in with your new password.",
  });
}
