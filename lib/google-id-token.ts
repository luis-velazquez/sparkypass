// Verifies Google ID tokens from the iOS app's Google sign-in.
//
// The iOS OAuth client lives in the Google Cloud project "SparkyPass"
// (Google Auth Platform → Clients → "SparkyPass iOS app", created 2026-11-18).
// A client ID is public (it ships inside the app), so it's the default here,
// the same way the Apple route defaults its bundle ID: a missing env var must
// never take sign-in down. GOOGLE_IOS_CLIENT_ID (comma-separated) overrides it.

import { createRemoteJWKSet, jwtVerify } from "jose";

export const GOOGLE_IOS_CLIENT_ID_DEFAULT =
  "629014723411-mkmavovhj73htndd64fq94shi4kg2tab.apps.googleusercontent.com";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export interface GoogleClaims {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

export function googleAudiences(): string[] {
  const fromEnv = (process.env.GOOGLE_IOS_CLIENT_ID ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : [GOOGLE_IOS_CLIENT_ID_DEFAULT];
}

/** Throws when the token is not a valid Google ID token for our iOS client. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleClaims> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: googleAudiences(),
  });
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("missing sub");
  }
  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
    name: typeof payload.name === "string" ? payload.name : null,
  };
}

/** How a provider is named in emails and messages. */
export function providerLabel(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "apple") return "Apple";
  return provider;
}

export type LinkSubject =
  | { ok: true; subject: string }
  | { ok: false; status: number; code: string; error: string };

/**
 * The provider account a link route may attach. For Google it comes from a
 * verified ID token, never from the request body: otherwise anyone could claim
 * someone else's Google account id and bind it to their own SparkyPass
 * account. Apple still sends providerSubject in the body (unchanged here;
 * verifying Apple's identity token the same way is a follow-up).
 */
export async function linkSubject(
  provider: string,
  body: { idToken?: unknown; providerSubject?: unknown },
): Promise<LinkSubject> {
  if (provider === "google") {
    const idToken = typeof body.idToken === "string" ? body.idToken : null;
    if (!idToken) {
      return {
        ok: false,
        status: 400,
        code: "MISSING_FIELDS",
        error: "idToken is required to link Google",
      };
    }
    try {
      const claims = await verifyGoogleIdToken(idToken);
      return { ok: true, subject: claims.sub };
    } catch (err) {
      console.warn("[auth/mobile/link] Google token verification failed:", err);
      return {
        ok: false,
        status: 401,
        code: "INVALID_TOKEN",
        error: "Invalid Google ID token",
      };
    }
  }
  const subject =
    typeof body.providerSubject === "string" ? body.providerSubject.trim() : "";
  if (!subject) {
    return {
      ok: false,
      status: 400,
      code: "MISSING_FIELDS",
      error: "providerSubject is required",
    };
  }
  return { ok: true, subject };
}
