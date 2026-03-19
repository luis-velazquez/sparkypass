import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json(
        { error: "Unable to set password" },
        { status: 400 }
      );
    }

    // Only allow setting password for verified users who don't have one yet
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email first" },
        { status: 400 }
      );
    }

    if (user.passwordHash) {
      return NextResponse.json(
        { error: "Password is already set. Use forgot password to reset it." },
        { status: 400 }
      );
    }

    // Hash and save password
    const passwordHash = await hash(password, 10);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
