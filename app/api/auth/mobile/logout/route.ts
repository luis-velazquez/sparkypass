// POST /api/auth/mobile/logout
//
// Revoke a refresh token. Idempotent: revoking an unknown or already-revoked
// token returns 200. The client should also discard the access token locally
// — access tokens remain valid until their natural exp (≤ 1 hour).

import { NextRequest, NextResponse } from "next/server";
import { revokeRefreshToken } from "@/lib/auth-mobile";

interface RequestBody {
  refreshToken?: unknown;
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
  if (!refreshToken) {
    return NextResponse.json(
      { error: "refreshToken is required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  await revokeRefreshToken(refreshToken);
  return NextResponse.json({ ok: true });
}
