import { NextResponse } from "next/server";
import { db, users, passwordResetTokens } from "@/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 3 forgot-password requests per 15 minutes
const forgotPasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Get token expiry (1 hour from now)
function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}

export async function POST(request: Request) {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    const { success, remaining } = forgotPasswordLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "900", "X-RateLimit-Remaining": String(remaining) } }
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

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
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
      // This prevents email enumeration attacks
      return NextResponse.json({ success: true });
    }

    // Only allow password reset for email auth users
    if (user.authProvider !== "email") {
      // Don't reveal auth provider - just return success
      return NextResponse.json({ success: true });
    }

    // Delete any existing reset tokens for this user
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    // Generate new reset token
    const token = generateToken();
    const tokenId = crypto.randomUUID();
    const expiresAt = getTokenExpiry();

    await db.insert(passwordResetTokens).values({
      id: tokenId,
      userId: user.id,
      token,
      expiresAt,
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send password reset email via Resend (non-blocking — don't fail if email fails)
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Reset URL: ${resetUrl}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
