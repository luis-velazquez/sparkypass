// Sign in with Apple token revocation (App Review Guideline 5.1.1(v)):
// when an account that used SiwA is deleted, the app must revoke the user's
// Apple tokens via Apple's REST API. The flow:
//   1. Sign-in: the mobile app sends Apple's one-shot authorizationCode
//      (5-minute lifetime) alongside the identity token; we exchange it for a
//      long-lived refresh token and store it on the linked_providers row.
//   2. Deletion: POST the stored refresh token to /auth/revoke.
// Every function here is best-effort: revocation must never block sign-in or
// deletion. Unconfigured env → clean no-ops (logged once per call site).
import { SignJWT, importPKCS8 } from "jose";

const APPLE_AUTH_BASE = "https://appleid.apple.com/auth";

function clientId(): string {
  return process.env.APPLE_IOS_BUNDLE_ID ?? "com.sparkypass.app";
}

export function siwaRevocationConfigured(): boolean {
  return Boolean(
    process.env.APPLE_TEAM_ID &&
      process.env.APPLE_SIWA_KEY_ID &&
      process.env.APPLE_SIWA_PRIVATE_KEY,
  );
}

// ES256 client-secret JWT per Apple's spec. The .p8 key is stored in env with
// literal \n escapes (Vercel single-line values) — normalize before import.
async function makeClientSecret(): Promise<string> {
  const pem = process.env.APPLE_SIWA_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_SIWA_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId())
    .sign(key);
}

/** Exchange the sign-in authorizationCode for Apple's refresh token.
 *  Returns null (never throws) when unconfigured or the exchange fails.
 *  `expectedSub` binds the code to the verified identity token's subject:
 *  Apple's token response carries an id_token, and a mismatched sub means
 *  the caller paired their own identityToken with someone else's code —
 *  storing that token would let their deletion revoke the victim's grant.
 *  (Payload is read without signature verification: the response arrived
 *  over TLS directly from Apple.) */
export async function exchangeAppleAuthCode(
  authorizationCode: string,
  expectedSub?: string,
): Promise<string | null> {
  if (!siwaRevocationConfigured()) {
    console.warn("[apple-revocation] env unset; skipping code exchange");
    return null;
  }
  try {
    const res = await fetch(`${APPLE_AUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId(),
        client_secret: await makeClientSecret(),
        code: authorizationCode,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn("[apple-revocation] token exchange failed", res.status);
      return null;
    }
    const data = (await res.json()) as {
      refresh_token?: string;
      id_token?: string;
    };
    if (expectedSub && data.id_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(data.id_token.split(".")[1], "base64url").toString(),
        ) as { sub?: string };
        if (payload.sub !== expectedSub) {
          console.warn("[apple-revocation] code subject mismatch; discarding");
          return null;
        }
      } catch {
        console.warn("[apple-revocation] unparseable id_token; discarding");
        return null;
      }
    }
    return data.refresh_token ?? null;
  } catch (e) {
    console.warn("[apple-revocation] token exchange error", e);
    return null;
  }
}

/** Revoke a stored Apple refresh token. Returns true on success (Apple
 *  answers 200 with an empty body). Never throws. */
export async function revokeAppleRefreshToken(
  refreshToken: string,
): Promise<boolean> {
  if (!siwaRevocationConfigured()) {
    console.warn("[apple-revocation] env unset; skipping revocation");
    return false;
  }
  try {
    const res = await fetch(`${APPLE_AUTH_BASE}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId(),
        client_secret: await makeClientSecret(),
        token: refreshToken,
        token_type_hint: "refresh_token",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.warn("[apple-revocation] revoke failed", res.status);
    else console.log("[apple-revocation] revoked ok");
    return res.ok;
  } catch (e) {
    console.warn("[apple-revocation] revoke error", e);
    return false;
  }
}
