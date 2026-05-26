// POST /api/account/link
//
// Authenticated. Attach an additional OAuth provider (Google or Apple) to the
// currently-signed-in user. Used by the mobile Settings screen flow ("Also
// sign in with Apple") — different from the unauthenticated link-request /
// link-confirm flow which is for first-time conflict resolution.
//
// Body:
//   { provider: "google" | "apple", idToken: string, nonce?: string }
// nonce required for Apple (replay protection).

import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { auth } from "@/auth";
import {
  db,
  linkedProviders,
  linkedProviderValues,
} from "@/lib/db";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

interface RequestBody {
  provider?: unknown;
  idToken?: unknown;
  nonce?: unknown;
}

interface IdTokenPayload {
  sub: string;
  nonce?: string;
}

async function verifyProviderToken(
  provider: "google" | "apple",
  idToken: string,
  nonce: string | null,
): Promise<{ ok: true; subject: string } | { ok: false; reason: string }> {
  if (provider === "google") {
    const audience = process.env.GOOGLE_IOS_CLIENT_ID;
    if (!audience) return { ok: false, reason: "GOOGLE_IOS_CLIENT_ID_MISSING" };
    try {
      const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience,
      });
      if (typeof payload.sub !== "string") return { ok: false, reason: "INVALID_TOKEN" };
      return { ok: true, subject: payload.sub };
    } catch {
      return { ok: false, reason: "INVALID_TOKEN" };
    }
  }

  // provider === "apple"
  const audience = process.env.APPLE_IOS_BUNDLE_ID;
  if (!audience) return { ok: false, reason: "APPLE_IOS_BUNDLE_ID_MISSING" };
  if (!nonce) return { ok: false, reason: "MISSING_NONCE" };

  let claims: IdTokenPayload;
  try {
    const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience,
    });
    if (typeof payload.sub !== "string") return { ok: false, reason: "INVALID_TOKEN" };
    claims = payload as unknown as IdTokenPayload;
  } catch {
    return { ok: false, reason: "INVALID_TOKEN" };
  }

  const expectedNonceHash = crypto.createHash("sha256").update(nonce).digest("hex");
  if (claims.nonce && claims.nonce !== expectedNonceHash) {
    return { ok: false, reason: "INVALID_NONCE" };
  }

  return { ok: true, subject: claims.sub };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const provider = typeof body.provider === "string" ? body.provider : null;
  const idToken = typeof body.idToken === "string" ? body.idToken : null;
  const nonce = typeof body.nonce === "string" ? body.nonce : null;

  if (!provider || !idToken) {
    return NextResponse.json(
      { error: "provider and idToken are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }
  if (provider !== "google" && provider !== "apple") {
    return NextResponse.json(
      { error: "Only google and apple can be linked via this endpoint", code: "UNSUPPORTED_PROVIDER" },
      { status: 400 },
    );
  }

  const verification = await verifyProviderToken(provider, idToken, nonce);
  if (!verification.ok) {
    return NextResponse.json(
      { error: "Token verification failed", code: verification.reason },
      { status: 401 },
    );
  }

  const providerSubject = verification.subject;

  // Refuse if (provider, subject) already linked to anyone else.
  const [existing] = await db
    .select()
    .from(linkedProviders)
    .where(
      and(
        eq(linkedProviders.provider, provider),
        eq(linkedProviders.providerSubject, providerSubject),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.userId === userId) {
      // Already linked to this user — return success idempotently.
      const all = await db
        .select({ provider: linkedProviders.provider })
        .from(linkedProviders)
        .where(eq(linkedProviders.userId, userId));
      return NextResponse.json({
        ok: true,
        alreadyLinked: true,
        providers: all.map((r: { provider: string }) => r.provider),
      });
    }
    return NextResponse.json(
      {
        error: "This sign-in method is already linked to a different account",
        code: "PROVIDER_TAKEN",
      },
      { status: 409 },
    );
  }

  await db.insert(linkedProviders).values({
    id: crypto.randomUUID(),
    userId,
    provider: provider as (typeof linkedProviderValues)[number],
    providerSubject,
  });

  const all = await db
    .select({ provider: linkedProviders.provider })
    .from(linkedProviders)
    .where(eq(linkedProviders.userId, userId));

  return NextResponse.json({
    ok: true,
    alreadyLinked: false,
    providers: all.map((r: { provider: string }) => r.provider),
  });
}
