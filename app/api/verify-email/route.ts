import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db, users, verificationTokens } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find the verification token
    const [verificationRecord] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          gt(verificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Build update: always verify email
    const updateData: {
      emailVerified: boolean;
      passwordHash?: string;
      updatedAt: Date;
    } = {
      emailVerified: true,
      updatedAt: new Date(),
    };

    // If password provided, hash and save it
    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hash(password, 10);
    }

    // Update user
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, verificationRecord.userId));

    // Delete the verification token (one-time use)
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.id, verificationRecord.id));

    // Get user email for the frontend
    const [verifiedUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, verificationRecord.userId))
      .limit(1);

    return NextResponse.json({ success: true, email: verifiedUser?.email });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
