import { NextResponse } from "next/server";
import { db, users, verificationTokens } from "@/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 3 resend requests per 5 minutes
const resendLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 3 });

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
    const { success, remaining } = resendLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": "300", "X-RateLimit-Remaining": String(remaining) } }
      );
    }
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Don't reveal if email exists - just return success
      return NextResponse.json({ success: true });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this user
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.userId, user.id));

    // Generate new verification token
    const token = generateToken();
    const tokenId = crypto.randomUUID();
    const expiresAt = getTokenExpiry();

    await db.insert(verificationTokens).values({
      id: tokenId,
      userId: user.id,
      token,
      expiresAt,
    });

    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    // Send verification email via Resend (non-blocking — don't fail if email fails)
    try {
      await sendVerificationEmail(user.email, user.name, verificationUrl);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Verification URL: ${verificationUrl}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
