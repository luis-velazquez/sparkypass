// POST /api/auth/mobile/email
//
// Mobile email + password login. Returns a fresh access + refresh token pair.
// Parallels the NextAuth Credentials provider in auth.ts but for mobile clients
// that can't use cookie sessions.

import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { createTokenPair } from "@/lib/auth-mobile";

interface RequestBody {
  email?: unknown;
  password?: unknown;
  deviceId?: unknown;
}

export async function POST(request: NextRequest) {
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
  const password = typeof body.password === "string" ? body.password : null;
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;

  if (!email || !password || !deviceId) {
    return NextResponse.json(
      { error: "email, password, and deviceId are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Single error message for both unknown email and bad password — prevents
  // account enumeration. Same response for soft-deleted users.
  const INVALID = NextResponse.json(
    { error: "Invalid email or password", code: "INVALID_CREDENTIALS" },
    { status: 401 },
  );

  if (!user || !user.passwordHash) return INVALID;

  let isValid = false;
  try {
    isValid = await compare(password, user.passwordHash);
  } catch (err) {
    console.error("[auth/mobile/email] bcrypt error:", err);
    return NextResponse.json(
      { error: "Authentication failed", code: "INTERNAL" },
      { status: 500 },
    );
  }
  if (!isValid) return INVALID;

  // Restore-on-sign-in: if the user is soft-deleted within the 30-day grace and
  // proves possession of the password, clear deleted_at. Mirrors the OAuth same-
  // provider restore in resolveOAuthUser.
  let accountRestored = false;
  if (user.deletedAt) {
    await db
      .update(users)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    accountRestored = true;
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
      isEmailVerified: user.emailVerified,
      subscriptionStatus: user.subscriptionStatus,
    },
    isNewUser: false,
    accountRestored,
    needsProfileCompletion: !(
      user.username &&
      user.city &&
      user.state &&
      user.dateOfBirth
    ),
  });
}
