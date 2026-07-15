// POST /api/auth/mobile/verify-email
//
// Consume the emailed 6-digit verification code and sign the user in
// (native-auth PRD US-002). On success this marks the email verified and
// returns the same TokenResponse shape as /api/auth/mobile/email so the app
// lands in the signed-in state with no extra step.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { createTokenPair } from "@/lib/auth-mobile";
import { consumeAuthCode } from "@/lib/auth-codes";
import { sendWelcomeTrialEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Generous — the per-code attempts counter (5) is the real guard; this just
// blunts cross-account spraying from one IP.
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

interface RequestBody {
  email?: unknown;
  code?: unknown;
  deviceId?: unknown;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = verifyLimiter.check(ip);
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
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;

  if (!email || !code || !deviceId) {
    return NextResponse.json(
      { error: "email, code, and deviceId are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  const result = await consumeAuthCode(email, "verify_email", code);
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
    .select()
    .from(users)
    .where(eq(users.id, result.userId))
    .limit(1);

  if (!user || user.deletedAt) {
    return NextResponse.json(
      { error: "That code has expired. Request a new one.", code: "CODE_EXPIRED" },
      { status: 400 },
    );
  }

  const firstVerification = !user.emailVerified;
  if (firstVerification) {
    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Welcome email marks the account fully set up (web parity: set-password
    // sends it after link verification). Non-blocking.
    try {
      await sendWelcomeTrialEmail(user.email, user.name);
    } catch (err) {
      console.error("[auth/mobile/verify-email] welcome email failed:", err);
    }
  }

  const pair = await createTokenPair(user.id, deviceId);

  return NextResponse.json({
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    accessTokenExpiresAt: pair.accessTokenExpiresAt.toISOString(),
    refreshTokenExpiresAt: pair.refreshTokenExpiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      isEmailVerified: true,
      subscriptionStatus: user.subscriptionStatus,
    },
    isNewUser: firstVerification,
    accountRestored: false,
    needsProfileCompletion: !(
      user.username &&
      user.city &&
      user.state &&
      user.dateOfBirth
    ),
  });
}
