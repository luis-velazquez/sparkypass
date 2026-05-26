// POST /api/auth/mobile/refresh
//
// Exchange a refresh token for a fresh access + refresh pair. Strict rotation
// with a 30-second grace overlap per audit OQ#2. Theft signals (reuse beyond
// grace, expired, revoked) return 401 and revoke the whole device session.

import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/auth-mobile";

interface RequestBody {
  refreshToken?: unknown;
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

  const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : null;
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;

  if (!refreshToken || !deviceId) {
    return NextResponse.json(
      { error: "refreshToken and deviceId are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  const result = await rotateRefreshToken(refreshToken, deviceId);

  if (!result.ok) {
    // Map all failure modes to 401. The reason code helps the client decide
    // whether to force a fresh sign-in (theft, expired, revoked, deleted) or
    // simply report a transient error.
    return NextResponse.json(
      { error: "Refresh failed", code: result.reason.toUpperCase() },
      { status: 401 },
    );
  }

  return NextResponse.json({
    accessToken: result.pair.accessToken,
    refreshToken: result.pair.refreshToken,
    accessTokenExpiresAt: result.pair.accessTokenExpiresAt.toISOString(),
    refreshTokenExpiresAt: result.pair.refreshTokenExpiresAt.toISOString(),
  });
}
