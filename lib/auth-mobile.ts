// Mobile auth — JWT access tokens + session resolution for mobile clients.
//
// Access tokens are short-lived JWTs signed with MOBILE_JWT_SECRET (distinct from
// AUTH_SECRET used by NextAuth — this keeps mobile and web auth blast radii separate).
// Refresh tokens are NOT JWTs; they're opaque random strings whose SHA-256 hash is
// stored in the `refresh_tokens` table. The refresh endpoint (Phase 1C) verifies and
// rotates them with a 30-second grace overlap, per audit OQ#2.
//
// This module provides:
//   - signAccessToken(userId)       → mint a JWT for a user
//   - verifyAccessToken(token)      → return decoded payload or null
//   - getMobileSession(token)       → return NextAuth-shaped Session or null
//                                     (rejects if user has deleted_at set)

import { SignJWT, jwtVerify } from "jose";
import { eq, and, isNull } from "drizzle-orm";
import crypto from "crypto";
import {
  db,
  users,
  refreshTokens,
  linkedProviders,
  type LinkedProviderValue,
} from "@/lib/db";
import { TRIAL_PERIOD_MS } from "@/lib/subscription";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;  // 1 hour
const REFRESH_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;  // 90 days (sliding)
const REFRESH_GRACE_OVERLAP_SECONDS = 30;  // OQ#2: previous token honored for 30s after rotation
const ISSUER = "sparkypass-mobile";
const AUDIENCE = "sparkypass-mobile-client";

function getSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "MOBILE_JWT_SECRET is not set. Generate one with: openssl rand -base64 64",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AccessTokenPayload {
  sub: string;       // user id
  iat: number;       // issued at (seconds)
  exp: number;       // expires (seconds)
  iss: string;
  aud: string;
}

/**
 * Mint a short-lived JWT access token for a user. Called by /api/auth/mobile/*
 * endpoints after they verify an Apple/Google/email credential.
 */
export async function signAccessToken(userId: string): Promise<string> {
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(getSecret());
}

/**
 * Verify a JWT access token and return its payload. Returns null on any failure
 * (bad signature, expired, wrong issuer/audience, malformed). Never throws.
 */
export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== "string") return null;
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Shape we return for mobile-authenticated requests. Matches the NextAuth Session
 * shape closely enough that downstream code (`session?.user?.id`, subscription gates,
 * etc.) works unchanged. The `expires` field is the JWT exp converted to ISO.
 */
export interface MobileSession {
  user: {
    id: string;
    email: string;
    name: string;
    profileComplete: boolean;
    isEmailVerified: boolean;
    subscriptionStatus: string | null;
    trialEndsAt: string | null;
    subscriptionPeriodEnd: string | null;
  };
  expires: string;
}

/**
 * Given a Bearer token, verify it and resolve the user. Returns a Session-shaped
 * object on success, or null if the token is invalid, the user is gone, or the
 * user has been soft-deleted.
 *
 * Soft-delete rejection here is critical: even if a refresh token survives somehow,
 * a deleted user cannot make authenticated requests.
 */
export async function getMobileSession(
  token: string,
): Promise<MobileSession | null> {
  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) return null;
  if (user.deletedAt) return null;  // soft-deleted — reject

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profileComplete: Boolean(
        user.username && user.city && user.state && user.dateOfBirth,
      ),
      isEmailVerified: user.emailVerified,
      subscriptionStatus: user.subscriptionStatus ?? null,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
      subscriptionPeriodEnd: user.subscriptionPeriodEnd?.toISOString() ?? null,
    },
    expires: new Date(payload.exp * 1000).toISOString(),
  };
}

// ─── Refresh tokens ─────────────────────────────────────────────────────────
//
// Refresh tokens are opaque 256-bit random strings (base64url). We never store
// the raw token — only SHA-256 of it. The token plaintext is returned to the
// client exactly once, on issuance.
//
// Rotation (audit OQ#2): every successful refresh mints a new token and marks
// the old row as rotated (rotated_at, rotated_to_hash). The old token remains
// honored for REFRESH_GRACE_OVERLAP_SECONDS so that retries on flaky networks
// don't break the user. Beyond that window, presenting an already-rotated token
// is treated as a theft signal: the entire device session is revoked and the
// caller is forced to re-authenticate.

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("base64url");  // 256 bits
}

export interface IssuedTokenPair {
  accessToken: string;
  refreshToken: string;       // opaque; return to client and never persist plaintext
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

/**
 * Mint a fresh access + refresh token pair for a user. Inserts a row into
 * `refresh_tokens`. Called by the OAuth/email login endpoints after credential
 * verification.
 */
export async function createTokenPair(
  userId: string,
  deviceId: string,
): Promise<IssuedTokenPair> {
  const now = new Date();
  const refreshExpiresAt = new Date(
    now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  );
  const accessExpiresAt = new Date(
    now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000,
  );

  const refreshTokenPlaintext = generateOpaqueToken();
  const refreshTokenHash = hashToken(refreshTokenPlaintext);

  await db.insert(refreshTokens).values({
    id: crypto.randomUUID(),
    userId,
    deviceId,
    tokenHash: refreshTokenHash,
    createdAt: now,
    expiresAt: refreshExpiresAt,
  });

  const accessToken = await signAccessToken(userId);

  return {
    accessToken,
    refreshToken: refreshTokenPlaintext,
    accessTokenExpiresAt: accessExpiresAt,
    refreshTokenExpiresAt: refreshExpiresAt,
  };
}

export interface RotateResult {
  ok: true;
  pair: IssuedTokenPair;
}

export interface RotateError {
  ok: false;
  reason:
    | "not_found"           // token never existed (likely fabricated)
    | "expired"             // past expiresAt
    | "revoked"             // explicit logout or theft revocation
    | "reuse_detected"      // rotated token used past the grace window — theft signal
    | "user_deleted"        // user soft-deleted
    | "user_missing";       // user record gone (shouldn't happen under normal flow)
}

/**
 * Exchange a refresh token for a new pair. Implements strict rotation with a
 * 30-second grace overlap (OQ#2):
 *   - If the presented token is the current (un-rotated) one → rotate, issue new pair.
 *   - If the presented token has been rotated and we're within grace → return the
 *     successor's effects re-issuing is not safe (we'd double-emit); the safe
 *     behavior is to recognize the legitimate retry by simply returning a NEW pair
 *     derived from the SAME user/device. The successor's rotated_to row replaces
 *     the current one.
 *   - If presented token is rotated and grace has expired → theft. Revoke all
 *     refresh tokens for this (user, device).
 *   - If revoked or expired or unknown → reject without revocation cascade.
 */
export async function rotateRefreshToken(
  presentedToken: string,
  deviceId: string,
): Promise<RotateResult | RotateError> {
  const presentedHash = hashToken(presentedToken);

  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, presentedHash))
    .limit(1);

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  // Validate that the deviceId matches — otherwise the token is being presented
  // from a different device than where it was issued. Treat as not_found rather
  // than expose the existence of a token bound to another device.
  if (row.deviceId !== deviceId) {
    return { ok: false, reason: "not_found" };
  }

  if (row.revokedAt) {
    return { ok: false, reason: "revoked" };
  }

  const now = new Date();
  if (row.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }

  // Rotation detection: rotated_at set means this token has already been rotated.
  if (row.rotatedAt) {
    const ageMs = now.getTime() - row.rotatedAt.getTime();
    if (ageMs <= REFRESH_GRACE_OVERLAP_SECONDS * 1000) {
      // Within grace window — this is a legitimate retry. Re-issue a fresh pair
      // (the in-flight successor may or may not have reached the client; either
      // way, we now hand back a definitive new pair). The original rotated_to
      // chain is preserved for forensic purposes; the new pair has no rotation
      // history.
      const refreshTokenPlaintext = generateOpaqueToken();
      const refreshTokenHash = hashToken(refreshTokenPlaintext);
      const refreshExpiresAt = new Date(
        now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000,
      );

      await db.insert(refreshTokens).values({
        id: crypto.randomUUID(),
        userId: row.userId,
        deviceId,
        tokenHash: refreshTokenHash,
        createdAt: now,
        expiresAt: refreshExpiresAt,
      });

      const accessToken = await signAccessToken(row.userId);
      return {
        ok: true,
        pair: {
          accessToken,
          refreshToken: refreshTokenPlaintext,
          accessTokenExpiresAt: new Date(
            now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000,
          ),
          refreshTokenExpiresAt: refreshExpiresAt,
        },
      };
    }

    // Past grace window — theft signal. Revoke all active tokens for this device.
    await db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(
        and(
          eq(refreshTokens.userId, row.userId),
          eq(refreshTokens.deviceId, deviceId),
          isNull(refreshTokens.revokedAt),
        ),
      );
    return { ok: false, reason: "reuse_detected" };
  }

  // Re-check user is still active (could have been soft-deleted between issuance and refresh).
  const [user] = await db
    .select({ id: users.id, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  if (!user) return { ok: false, reason: "user_missing" };
  if (user.deletedAt) return { ok: false, reason: "user_deleted" };

  // Happy path: rotate. Mint successor, mark predecessor.
  const refreshTokenPlaintext = generateOpaqueToken();
  const refreshTokenHash = hashToken(refreshTokenPlaintext);
  const refreshExpiresAt = new Date(
    now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  );

  await db.insert(refreshTokens).values({
    id: crypto.randomUUID(),
    userId: row.userId,
    deviceId,
    tokenHash: refreshTokenHash,
    createdAt: now,
    expiresAt: refreshExpiresAt,
  });

  await db
    .update(refreshTokens)
    .set({
      rotatedAt: now,
      rotatedToHash: refreshTokenHash,
      lastUsedAt: now,
    })
    .where(eq(refreshTokens.id, row.id));

  const accessToken = await signAccessToken(row.userId);
  return {
    ok: true,
    pair: {
      accessToken,
      refreshToken: refreshTokenPlaintext,
      accessTokenExpiresAt: new Date(
        now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000,
      ),
      refreshTokenExpiresAt: refreshExpiresAt,
    },
  };
}

/**
 * Mark a refresh token as revoked. Idempotent: revoking an already-revoked or
 * non-existent token returns silently. Used by /api/auth/mobile/logout.
 */
export async function revokeRefreshToken(
  presentedToken: string,
): Promise<void> {
  const presentedHash = hashToken(presentedToken);
  const now = new Date();
  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(
      and(
        eq(refreshTokens.tokenHash, presentedHash),
        isNull(refreshTokens.revokedAt),
      ),
    );
}

// ─── OAuth user resolution ──────────────────────────────────────────────────
//
// Per plan §D-16 (auto-link by email with explicit confirmation): the OAuth
// endpoints look up the user in 3 steps, returning one of three outcomes:
//
//   1. Linked provider hit       → sign in existing user
//   2. Email matches existing    → 409 conflict, client triggers link-request flow
//   3. No match anywhere         → create new user + link this provider
//
// We deliberately never silently merge accounts: an email match without an
// existing provider link is treated as a deliberate user-confirmation moment,
// not a free upgrade.

export type ResolveOAuthResult =
  | { kind: "existing"; userId: string; restored?: boolean }
  | { kind: "new"; userId: string }
  | { kind: "conflict"; existingEmail: string }   // client should run link-request flow
  | { kind: "conflict_deleted"; existingEmail: string };  // email is on a soft-deleted account

export interface OAuthClaims {
  provider: LinkedProviderValue;       // "google" | "apple" (never "email" here)
  providerSubject: string;              // OAuth sub claim — stable identifier
  email: string | null;                 // may be null on Apple after first sign-in
  name: string | null;
  emailVerified: boolean;
}

/**
 * Find or create the user backing this OAuth credential. Does NOT mint tokens —
 * the caller (the endpoint) does that after deciding which response shape to
 * return.
 */
export async function resolveOAuthUser(
  claims: OAuthClaims,
): Promise<ResolveOAuthResult> {
  const normalizedEmail = claims.email?.toLowerCase().trim() || null;

  // 1. Linked provider hit — fast path for returning users.
  const [link] = await db
    .select()
    .from(linkedProviders)
    .where(
      and(
        eq(linkedProviders.provider, claims.provider),
        eq(linkedProviders.providerSubject, claims.providerSubject),
      ),
    )
    .limit(1);

  if (link) {
    const [user] = await db
      .select({ id: users.id, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.id, link.userId))
      .limit(1);
    if (user) {
      if (!user.deletedAt) {
        return { kind: "existing", userId: user.id };
      }
      // Same OAuth credential as a soft-deleted user is an unambiguous restore
      // signal: clear deletedAt and let them back in. Within the 30-day grace
      // their data is intact; after grace, the hard-delete cron would have
      // wiped the row entirely so we'd never reach here.
      await db
        .update(users)
        .set({ deletedAt: null })
        .where(eq(users.id, user.id));
      return { kind: "existing", userId: user.id, restored: true };
    }
    // Link exists but user row is gone — shouldn't happen under cascade FK.
    // Fall through to email match.
  }

  // 2. Email match. Two sub-cases:
  //    a) Active user with that email — refuse to auto-link; require explicit
  //       confirmation via the link-request flow.
  //    b) Soft-deleted user owns the email — refuse this OAuth path entirely.
  //       We can't restore from a different provider (the user identifying
  //       themselves through a NEW credential isn't sufficient proof). Client
  //       should tell the user to sign in via their original method.
  if (normalizedEmail) {
    const [user] = await db
      .select({ id: users.id, email: users.email, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (user) {
      if (user.deletedAt) {
        return { kind: "conflict_deleted", existingEmail: user.email };
      }
      return { kind: "conflict", existingEmail: user.email };
    }
  }

  // 3. No match — create a fresh user. Mirrors the OAuth user-creation in
  //    auth.ts's signIn callback (30-day trial, emailVerified=true since
  //    OAuth providers vouch for the email).
  const newUserId = crypto.randomUUID();
  const trialEndsAt = new Date(Date.now() + TRIAL_PERIOD_MS);

  // If we have no email at all (Apple after first sign-in with relay), use a
  // placeholder that satisfies the NOT NULL + UNIQUE constraint. The user can
  // claim a real email via link-request/link-confirm later.
  const placeholderEmail =
    normalizedEmail ?? `apple-${claims.providerSubject}@no-email.local`;

  await db.insert(users).values({
    id: newUserId,
    email: placeholderEmail,
    name: claims.name || "Sparky user",
    authProvider: claims.provider,
    emailVerified: claims.emailVerified,
    trialEndsAt,
    subscriptionStatus: "trialing",
    subscriptionSource: "trial",
  });

  await db.insert(linkedProviders).values({
    id: crypto.randomUUID(),
    userId: newUserId,
    provider: claims.provider,
    providerSubject: claims.providerSubject,
  });

  return { kind: "new", userId: newUserId };
}
