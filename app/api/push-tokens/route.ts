// POST /api/push-tokens
//
// Register an Expo push token for the current user + device. The notification
// crons (streak reminder, weekly digest) look up tokens by user_id at send
// time. Tokens are unique per (user, device) and refresh whenever Expo rotates
// them on the client.

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { auth } from "@/auth";
import { db, pushTokens, pushPlatformValues } from "@/lib/db";

interface RequestBody {
  token?: unknown;
  deviceId?: unknown;
  platform?: unknown;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : null;
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;
  const platform = typeof body.platform === "string" ? body.platform : null;

  if (!token || !deviceId || !platform) {
    return NextResponse.json(
      { error: "token, deviceId, and platform are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  if (!(pushPlatformValues as readonly string[]).includes(platform)) {
    return NextResponse.json(
      { error: "Unsupported platform", code: "BAD_PLATFORM" },
      { status: 400 },
    );
  }

  // Expo tokens look like `ExponentPushToken[xxx]` — light sanity check.
  if (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) {
    return NextResponse.json(
      { error: "Token does not look like an Expo push token", code: "INVALID_TOKEN_FORMAT" },
      { status: 400 },
    );
  }

  const now = new Date();
  const userId = session.user.id;

  // Upsert by (user, device): if a previous token exists for this user+device,
  // replace it (Expo rotates tokens on app reinstall). If the same token already
  // exists, just touch lastUsedAt.
  const [existing] = await db
    .select()
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.deviceId, deviceId)))
    .limit(1);

  if (existing) {
    if (existing.token === token) {
      await db
        .update(pushTokens)
        .set({ lastUsedAt: now })
        .where(eq(pushTokens.id, existing.id));
      return NextResponse.json({ ok: true, updated: false });
    }
    await db
      .update(pushTokens)
      .set({
        token,
        platform: platform as (typeof pushPlatformValues)[number],
        lastUsedAt: now,
      })
      .where(eq(pushTokens.id, existing.id));
    return NextResponse.json({ ok: true, updated: true });
  }

  await db.insert(pushTokens).values({
    id: crypto.randomUUID(),
    userId,
    token,
    deviceId,
    platform: platform as (typeof pushPlatformValues)[number],
  });

  return NextResponse.json({ ok: true, created: true });
}
