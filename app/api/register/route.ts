import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { db, users, verificationTokens } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail, sendWelcomeTrialEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 5 registrations per 15 minutes
const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Get token expiry (24 hours from now)
function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

export async function POST(request: Request) {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    const { success, remaining } = registerLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "900", "X-RateLimit-Remaining": String(remaining) } }
      );
    }
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate name (letters, spaces, hyphens, apostrophes only)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name) || name.length > 100) {
      return NextResponse.json(
        { error: "Please enter a valid name" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate password (min 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user
    const userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      authProvider: "email",
      emailVerified: false,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscriptionStatus: "trialing",
    });

    // Generate verification token
    const token = generateToken();
    const tokenId = crypto.randomUUID();
    const expiresAt = getTokenExpiry();

    await db.insert(verificationTokens).values({
      id: tokenId,
      userId,
      token,
      expiresAt,
    });

    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    // Send verification email via Resend (non-blocking — don't fail registration if email fails)
    try {
      await sendVerificationEmail(email.toLowerCase(), name.trim(), verificationUrl);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    // Send welcome trial email (non-blocking)
    try {
      await sendWelcomeTrialEmail(email.toLowerCase(), name.trim());
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Verification URL: ${verificationUrl}`);
    }

    return NextResponse.json(
      { success: true, userId, email: email.toLowerCase() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
