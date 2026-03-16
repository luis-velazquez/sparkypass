import { NextResponse } from "next/server";
import { db, users, passwordResetTokens } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { hash } from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 5 reset-password attempts per 15 minutes
const resetPasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

export async function POST(request: Request) {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    const { success, remaining } = resetPasswordLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "900", "X-RateLimit-Remaining": String(remaining) } }
      );
    }
    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the reset token
    const [resetRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await hash(password, 10);

    // Update user's password
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetRecord.userId));

    // Delete the used reset token
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, resetRecord.id));

    // Delete any other reset tokens for this user (cleanup)
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, resetRecord.userId));

    // Log password reset success (MVP)
    console.log(`[PASSWORD RESET] User ${resetRecord.userId} reset their password`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
