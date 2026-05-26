// POST /api/auth/mobile/google
//
// Mobile Google sign-in. Verifies a Google ID token (issued by the iOS app's
// Google Sign-In SDK) against Google's JWKS, then resolves or creates the user
// per the policy in lib/auth-mobile.ts:resolveOAuthUser (no silent merges; an
// email collision with an existing account triggers the link-request flow).

import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { createTokenPair, resolveOAuthUser } from "@/lib/auth-mobile";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

interface RequestBody {
  idToken?: unknown;
  deviceId?: unknown;
}

interface GoogleIdTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
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

  const idToken = typeof body.idToken === "string" ? body.idToken : null;
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;

  if (!idToken || !deviceId) {
    return NextResponse.json(
      { error: "idToken and deviceId are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  const audience = process.env.GOOGLE_IOS_CLIENT_ID;
  if (!audience) {
    console.error("[auth/mobile/google] GOOGLE_IOS_CLIENT_ID not configured");
    return NextResponse.json(
      { error: "Server misconfigured", code: "INTERNAL" },
      { status: 500 },
    );
  }

  let claims: GoogleIdTokenPayload;
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
    });
    if (typeof payload.sub !== "string") throw new Error("missing sub");
    claims = payload as unknown as GoogleIdTokenPayload;
  } catch (err) {
    console.warn("[auth/mobile/google] Token verification failed:", err);
    return NextResponse.json(
      { error: "Invalid Google ID token", code: "INVALID_TOKEN" },
      { status: 401 },
    );
  }

  const result = await resolveOAuthUser({
    provider: "google",
    providerSubject: claims.sub,
    email: claims.email ?? null,
    name: claims.name ?? null,
    emailVerified: Boolean(claims.email_verified),
  });

  if (result.kind === "conflict") {
    return NextResponse.json(
      {
        error: "An account with this email already exists",
        code: "ACCOUNT_EXISTS",
        existingEmail: result.existingEmail,
        nextStep: "link-request",
      },
      { status: 409 },
    );
  }

  if (result.kind === "conflict_deleted") {
    return NextResponse.json(
      {
        error:
          "This email belongs to an account being deleted. Sign in via the original method to restore it, or wait for deletion to complete.",
        code: "ACCOUNT_PENDING_DELETION",
        existingEmail: result.existingEmail,
      },
      { status: 409 },
    );
  }

  // Mint tokens for "existing" (with restored flag if applicable) or "new".
  const pair = await createTokenPair(result.userId, deviceId);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, result.userId))
    .limit(1);

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
    isNewUser: result.kind === "new",
    accountRestored: result.kind === "existing" && Boolean(result.restored),
    needsProfileCompletion: !(
      user.username &&
      user.city &&
      user.state &&
      user.dateOfBirth
    ),
  });
}
