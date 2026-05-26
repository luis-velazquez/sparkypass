// POST /api/auth/mobile/link-confirm
//
// Unauthenticated. Step 2 of the Hide-My-Email linking flow (audit OQ#5).
// Consumes a 6-digit code that was emailed to the user by /link-request and
// attaches (provider, providerSubject) to the user with the matching email.
// On success, mints an access + refresh token pair so the client is signed in
// as the linked (existing) user immediately.

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt, isNull } from "drizzle-orm";
import crypto from "crypto";
import {
  db,
  users,
  linkCodes,
  linkedProviders,
  linkedProviderValues,
} from "@/lib/db";
import { createTokenPair } from "@/lib/auth-mobile";

interface RequestBody {
  email?: unknown;
  code?: unknown;
  provider?: unknown;
  providerSubject?: unknown;
  deviceId?: unknown;
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
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
  const code = typeof body.code === "string" ? body.code.trim() : null;
  const provider = typeof body.provider === "string" ? body.provider : null;
  const providerSubject = typeof body.providerSubject === "string" ? body.providerSubject : null;
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;

  if (!email || !code || !provider || !providerSubject || !deviceId) {
    return NextResponse.json(
      {
        error: "email, code, provider, providerSubject, and deviceId are required",
        code: "MISSING_FIELDS",
      },
      { status: 400 },
    );
  }

  if (!(linkedProviderValues as readonly string[]).includes(provider)) {
    return NextResponse.json(
      { error: "Unsupported provider", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const codeHash = hashCode(code);
  const now = new Date();

  // Find a matching, unexpired, unconsumed code row.
  const [linkCode] = await db
    .select()
    .from(linkCodes)
    .where(
      and(
        eq(linkCodes.email, email),
        eq(linkCodes.codeHash, codeHash),
        eq(linkCodes.provider, provider as (typeof linkedProviderValues)[number]),
        eq(linkCodes.providerSubject, providerSubject),
        gt(linkCodes.expiresAt, now),
        isNull(linkCodes.consumedAt),
      ),
    )
    .limit(1);

  if (!linkCode) {
    return NextResponse.json(
      { error: "Invalid or expired code", code: "INVALID_CODE" },
      { status: 401 },
    );
  }

  // Find the user. Email + soft-delete check.
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.deletedAt) {
    // User vanished between link-request and link-confirm — rare but possible.
    // Consume the code anyway so it can't be replayed.
    await db
      .update(linkCodes)
      .set({ consumedAt: now })
      .where(eq(linkCodes.id, linkCode.id));
    return NextResponse.json(
      { error: "Account no longer available", code: "USER_GONE" },
      { status: 410 },
    );
  }

  // Guardrail: ensure (provider, providerSubject) isn't already claimed by
  // another user. If it is, refuse — that would silently re-bind someone
  // else's OAuth identity to this account.
  const [existingLink] = await db
    .select()
    .from(linkedProviders)
    .where(
      and(
        eq(linkedProviders.provider, provider as (typeof linkedProviderValues)[number]),
        eq(linkedProviders.providerSubject, providerSubject),
      ),
    )
    .limit(1);

  if (existingLink && existingLink.userId !== user.id) {
    await db
      .update(linkCodes)
      .set({ consumedAt: now })
      .where(eq(linkCodes.id, linkCode.id));
    return NextResponse.json(
      {
        error: "This sign-in method is already linked to a different account",
        code: "PROVIDER_TAKEN",
      },
      { status: 409 },
    );
  }

  // Idempotent insert of the link row (in case of a retry after partial success).
  if (!existingLink) {
    await db.insert(linkedProviders).values({
      id: crypto.randomUUID(),
      userId: user.id,
      provider: provider as (typeof linkedProviderValues)[number],
      providerSubject,
    });
  }

  // Consume the code so it can't be reused.
  await db
    .update(linkCodes)
    .set({ consumedAt: now })
    .where(eq(linkCodes.id, linkCode.id));

  // Mint tokens — the client is now signed in as `user`.
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
    needsProfileCompletion: !(
      user.username &&
      user.city &&
      user.state &&
      user.dateOfBirth
    ),
    linkedProvider: provider,
  });
}
