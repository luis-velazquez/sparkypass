// POST /api/auth/mobile/forgot-password
//
// Start the in-app password reset (native-auth PRD US-003): email a 6-digit
// code, consumed by /api/auth/mobile/reset-password. Always returns the same
// 200 regardless of whether the email exists — no account enumeration. The
// client shows "if an account exists, we sent a code" and runs its own 60s
// resend countdown.
//
// Accounts without a password (Apple/Google-only) may use this flow to SET
// one — web precedent (/api/set-password) already lets verified users without
// a password add one, and completing the code proves inbox ownership.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { issueAuthCode } from "@/lib/auth-codes";
import { sendPasswordResetCodeEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Same window as the web /api/forgot-password.
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });

const GENERIC_OK = {
  success: true,
  message: "If an account exists for that email, we sent a reset code.",
};

interface RequestBody {
  email?: unknown;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = forgotLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many reset requests. Please try again later.", code: "RATE_LIMITED" },
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address", code: "INVALID_EMAIL" },
      { status: 400 },
    );
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Unknown or soft-deleted account: pretend success. Issuance failures
  // (cooldown/hourly cap) also collapse to the generic response — a distinct
  // error here would leak that the account exists.
  if (!user || user.deletedAt) {
    return NextResponse.json(GENERIC_OK);
  }

  const issued = await issueAuthCode(user.id, email, "password_reset");
  if (!issued.ok) {
    return NextResponse.json(GENERIC_OK);
  }

  try {
    await sendPasswordResetCodeEmail(email, user.name, issued.code);
  } catch (err) {
    console.error("[auth/mobile/forgot-password] email failed:", err);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Password reset code for ${email}: ${issued.code}`);
  }

  return NextResponse.json(GENERIC_OK);
}
