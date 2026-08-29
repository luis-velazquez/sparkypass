// POST /api/auth/mobile/register
//
// In-app email + password signup (native-auth PRD US-001). Unlike the web's
// email-first flow (/api/register — password set after clicking a link), the
// app collects the password up front and verifies the email with a 6-digit
// code. No tokens are returned here: the account can't sign in until the code
// is confirmed via /api/auth/mobile/verify-email.
//
// Re-registering an email that exists but was never verified (abandoned web or
// mobile signup) resumes registration: name/password are overwritten and a
// fresh code is sent. This is safe pre-verification — only the inbox owner can
// complete the flow — and it un-sticks users who'd otherwise hit a dead 409.

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db, users } from "@/lib/db";
import { issueAuthCode } from "@/lib/auth-codes";
import { sendVerificationCodeEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });

interface RequestBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  ageConfirmed?: unknown;
  timezone?: unknown;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = registerLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later.", code: "RATE_LIMITED" },
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

  const name = typeof body.name === "string" ? body.name.trim() : null;
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : null;
  const password = typeof body.password === "string" ? body.password : null;
  const ageConfirmed = body.ageConfirmed === true;
  const timezone = typeof body.timezone === "string" ? body.timezone : null;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email, and password are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }
  if (!ageConfirmed) {
    return NextResponse.json(
      { error: "You must confirm that you are at least 18 years old", code: "AGE_NOT_CONFIRMED" },
      { status: 400 },
    );
  }

  // Validation rules match the web /api/register for parity.
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name) || name.length > 100) {
    return NextResponse.json(
      { error: "Please enter a valid name", code: "INVALID_NAME" },
      { status: 400 },
    );
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address", code: "INVALID_EMAIL" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters", code: "WEAK_PASSWORD" },
      { status: 400 },
    );
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordHash = await hash(password, 10);
  const now = new Date();
  let userId: string;

  if (existingUser) {
    if (existingUser.deletedAt) {
      // Email slot is held through the 30-day soft-delete grace. Same code
      // as web so the client can offer "sign in to restore".
      return NextResponse.json(
        {
          error:
            "This account is scheduled for deletion. Sign in to restore it, or wait until deletion completes to re-register.",
          code: "ACCOUNT_PENDING_DELETION",
        },
        { status: 409 },
      );
    }
    if (existingUser.emailVerified || existingUser.authProvider !== "email") {
      return NextResponse.json(
        { error: "An account with this email already exists", code: "EMAIL_IN_USE" },
        { status: 409 },
      );
    }
    // Unverified email account — resume registration.
    userId = existingUser.id;
    await db
      .update(users)
      .set({
        name,
        passwordHash,
        ...(timezone ? { timezone } : {}),
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  } else {
    userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash,
      authProvider: "email",
      emailVerified: false,
      // NO server-side trial (2026-08-29): the paywall's Apple IAP intro
      // offer — 7-day trial or $0.99 first month — is the ONLY trial; a
      // server grant stacked ~14 free days on top of it. Accounts start
      // free (null status); Pro comes exclusively from RevenueCat/webhooks.
      betaAgreedAt: now,
      ...(timezone ? { timezone } : {}),
    });
  }

  const issued = await issueAuthCode(userId, email, "verify_email");
  if (!issued.ok) {
    // Cooldown/cap hit (rapid retry) — the account exists; the client should
    // route to the code screen and use its resend button after the cooldown.
    return NextResponse.json(
      {
        success: true,
        email,
        verificationRequired: true,
        codeSent: false,
        retryAfterSeconds: issued.retryAfterSeconds,
      },
      { status: 201 },
    );
  }

  // Email failures don't fail registration — the code screen has a resend.
  let codeSent = true;
  try {
    await sendVerificationCodeEmail(email, name, issued.code);
  } catch (err) {
    console.error("[auth/mobile/register] verification email failed:", err);
    codeSent = false;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Verification code for ${email}: ${issued.code}`);
  }

  return NextResponse.json(
    { success: true, email, verificationRequired: true, codeSent },
    { status: 201 },
  );
}
