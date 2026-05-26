// POST /api/auth/mobile/link-request
//
// Unauthenticated. Step 1 of the Hide-My-Email linking flow (audit OQ#5).
// Sends a 6-digit code to the email address the caller claims to own. The
// caller then completes linking by calling /api/auth/mobile/link-confirm with
// the code, which will attach the (provider, providerSubject) pair to the
// existing user.
//
// Anti-abuse:
//   - IP rate-limited (3 codes per 15 min)
//   - We always respond `{ sent: true }` — never reveal whether the email is
//     registered. Codes are only inserted/emailed when a real user exists.

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import { db, users, linkCodes, linkedProviderValues } from "@/lib/db";
import { sendLinkCodeEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const linkRequestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });
const CODE_TTL_MS = 10 * 60 * 1000;  // 10 minutes
const MAX_PENDING_CODES_PER_EMAIL = 5;  // per hour

interface RequestBody {
  email?: unknown;
  provider?: unknown;
  providerSubject?: unknown;
}

function generateSixDigitCode(): string {
  // crypto.randomInt gives a uniform integer; 100000..999999 → 6 digits guaranteed
  return String(crypto.randomInt(100000, 1000000));
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = linkRequestLimiter.check(ip);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many link requests. Try again later.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": "900", "X-RateLimit-Remaining": String(limit.remaining) },
      },
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

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : null;
  const provider = typeof body.provider === "string" ? body.provider : null;
  const providerSubject = typeof body.providerSubject === "string" ? body.providerSubject : null;

  if (!email || !provider || !providerSubject) {
    return NextResponse.json(
      { error: "email, provider, and providerSubject are required", code: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  if (!(linkedProviderValues as readonly string[]).includes(provider)) {
    return NextResponse.json(
      { error: "Unsupported provider", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  // Look up user — but always return success regardless of existence (anti-enum).
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // If user exists and isn't soft-deleted, emit a code.
  if (user && !user.deletedAt) {
    // Per-email rate limit: count unconsumed codes issued in the last hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await db
      .select({ id: linkCodes.id })
      .from(linkCodes)
      .where(and(eq(linkCodes.email, email), gt(linkCodes.createdAt, oneHourAgo)));

    if (recentCodes.length < MAX_PENDING_CODES_PER_EMAIL) {
      const code = generateSixDigitCode();
      const codeHash = hashCode(code);
      const expiresAt = new Date(Date.now() + CODE_TTL_MS);

      await db.insert(linkCodes).values({
        id: crypto.randomUUID(),
        email,
        provider: provider as (typeof linkedProviderValues)[number],
        providerSubject,
        codeHash,
        expiresAt,
      });

      try {
        await sendLinkCodeEmail(email, user.name, code, provider);
      } catch (err) {
        // Log but don't reveal email-send failures to the caller (anti-enum).
        console.error("[auth/mobile/link-request] sendLinkCodeEmail failed:", err);
      }
    }
    // If at-or-above MAX_PENDING_CODES, silently drop the request. No new code,
    // but we still return `{ sent: true }` to prevent timing-side enumeration.
  }

  // Always-success response. Real users get a code; nobody else does. Never tell
  // the caller whether the email is registered.
  return NextResponse.json({ sent: true });
}
