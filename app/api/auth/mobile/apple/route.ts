// POST /api/auth/mobile/apple
//
// Mobile Sign in with Apple. Verifies an Apple identity token against Apple's
// JWKS, validates the nonce for replay protection, then resolves or creates the
// user. Handles the two Apple quirks:
//   1. email is ONLY present on first sign-in (later sign-ins return only sub)
//   2. Hide My Email returns a @privaterelay.appleid.com address — handled by
//      resolveOAuthUser's email-conflict policy + the link-request/confirm flow.
// fullName is NOT in the identity token; the iOS client passes it separately
// on first sign-in and we apply it only when creating a new user.

import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db, users } from "@/lib/db";
import { createTokenPair, resolveOAuthUser } from "@/lib/auth-mobile";

const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

interface RequestBody {
  identityToken?: unknown;
  nonce?: unknown;
  fullName?: unknown;
  deviceId?: unknown;
}

interface AppleIdTokenPayload {
  sub: string;
  email?: string;
  email_verified?: string | boolean;   // Apple returns "true"/"false" as strings
  is_private_email?: string | boolean;
  nonce?: string;                       // SHA-256(nonce_supplied_at_signin)
}

interface FullNameInput {
  givenName?: string;
  familyName?: string;
}

function coerceBool(v: string | boolean | undefined): boolean {
  if (typeof v === "boolean") return v;
  return v === "true";
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

  const identityToken = typeof body.identityToken === "string" ? body.identityToken : null;
  const nonce = typeof body.nonce === "string" ? body.nonce : null;
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;
  const fullName = (body.fullName && typeof body.fullName === "object"
    ? (body.fullName as FullNameInput)
    : null);

  if (!identityToken || !nonce || !deviceId) {
    return NextResponse.json(
      { error: "identityToken, nonce, and deviceId are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  const audience = process.env.APPLE_IOS_BUNDLE_ID;
  if (!audience) {
    console.error("[auth/mobile/apple] APPLE_IOS_BUNDLE_ID not configured");
    return NextResponse.json(
      { error: "Server misconfigured", code: "INTERNAL" },
      { status: 500 },
    );
  }

  let claims: AppleIdTokenPayload;
  try {
    const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience,
    });
    if (typeof payload.sub !== "string") throw new Error("missing sub");
    claims = payload as unknown as AppleIdTokenPayload;
  } catch (err) {
    console.warn("[auth/mobile/apple] Token verification failed:", err);
    return NextResponse.json(
      { error: "Invalid Apple identity token", code: "INVALID_TOKEN" },
      { status: 401 },
    );
  }

  // Nonce replay protection: Apple echoes back SHA-256(client_nonce) in the
  // token's `nonce` claim. Verify it matches the nonce the client used.
  const expectedNonceHash = crypto
    .createHash("sha256")
    .update(nonce)
    .digest("hex");
  if (claims.nonce && claims.nonce !== expectedNonceHash) {
    console.warn("[auth/mobile/apple] Nonce mismatch");
    return NextResponse.json(
      { error: "Nonce verification failed", code: "INVALID_NONCE" },
      { status: 401 },
    );
  }

  // Derive a display name from fullName if provided (first sign-in only). Apple
  // does not include name in the token, so we trust the client here — there's
  // no security implication since the user controls their own display name.
  const derivedName =
    fullName?.givenName || fullName?.familyName
      ? `${fullName?.givenName ?? ""} ${fullName?.familyName ?? ""}`.trim()
      : null;

  const result = await resolveOAuthUser({
    provider: "apple",
    providerSubject: claims.sub,
    email: claims.email ?? null,
    name: derivedName,
    emailVerified: coerceBool(claims.email_verified),
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
    isPrivateEmail: coerceBool(claims.is_private_email),
  });
}
