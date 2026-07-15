// POST /api/auth/mobile/resend-code
//
// Re-issue the email-verification 6-digit code (native-auth PRD US-002).
// Verification codes only — password-reset resends go back through
// /api/auth/mobile/forgot-password, which has its own limits.
//
// Responses stay generic when no code was sent (unknown email, already
// verified, soft-deleted) to avoid becoming an account-existence oracle.
// The 60s cooldown does return a distinct 429 — the client needs the
// countdown, and the cooldown only fires when a code was just issued to
// this exact address, so it reveals nothing new.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { issueAuthCode } from "@/lib/auth-codes";
import { sendVerificationCodeEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const resendLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

const GENERIC_OK = {
  success: true,
  message: "If your account needs verification, we sent a new code.",
};

interface RequestBody {
  email?: unknown;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = resendLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
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
  if (!email) {
    return NextResponse.json(
      { error: "email is required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      emailVerified: users.emailVerified,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.deletedAt || user.emailVerified) {
    return NextResponse.json(GENERIC_OK);
  }

  const issued = await issueAuthCode(user.id, email, "verify_email");
  if (!issued.ok) {
    return NextResponse.json(
      {
        error:
          issued.reason === "cooldown"
            ? "A code was just sent. Wait a moment before requesting another."
            : "Too many codes requested. Please try again later.",
        code: issued.reason === "cooldown" ? "COOLDOWN" : "RATE_LIMITED",
        retryAfterSeconds: issued.retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(issued.retryAfterSeconds) } },
    );
  }

  try {
    await sendVerificationCodeEmail(email, user.name, issued.code);
  } catch (err) {
    console.error("[auth/mobile/resend-code] email failed:", err);
    return NextResponse.json(
      { error: "Couldn't send the email. Please try again.", code: "EMAIL_FAILED" },
      { status: 502 },
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Verification code for ${email}: ${issued.code}`);
  }

  return NextResponse.json(GENERIC_OK);
}
