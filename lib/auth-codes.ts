// Shared 6-digit auth-code issuance + verification for the mobile native-auth
// endpoints (register, verify-email, resend-code, forgot-password,
// reset-password). Pattern mirrors link_codes: SHA-256 at rest, short TTL,
// per-email issuance caps — plus an attempts counter (5 wrong guesses kills
// the code). A 6-digit space is small, so the attempt limit + TTL are the
// real defense; the hash just keeps codes out of DB dumps.

import crypto from "crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db, authCodes, type AuthCodePurpose } from "@/lib/db";

const CODE_TTL_MS = 15 * 60 * 1000;      // codes live 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;    // one send per email+purpose per 60s
const MAX_CODES_PER_HOUR = 5;            // issuance cap per email+purpose
const MAX_ATTEMPTS = 5;                  // wrong guesses before the code dies

export const CODE_TTL_MINUTES = CODE_TTL_MS / 60_000;

function generateSixDigitCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export type IssueCodeResult =
  | { ok: true; code: string; expiresAt: Date }
  | { ok: false; reason: "cooldown" | "too_many"; retryAfterSeconds: number };

/**
 * Mint a new 6-digit code for (user, email, purpose) and persist its hash.
 * Enforces the 60s resend cooldown and the hourly issuance cap. Consumes any
 * previously issued unconsumed codes for the same email+purpose so exactly
 * one code is valid at a time. The plaintext code is returned to the caller
 * for emailing and never stored.
 */
export async function issueAuthCode(
  userId: string,
  email: string,
  purpose: AuthCodePurpose,
): Promise<IssueCodeResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recent = await db
    .select({ id: authCodes.id, createdAt: authCodes.createdAt })
    .from(authCodes)
    .where(
      and(
        eq(authCodes.email, email),
        eq(authCodes.purpose, purpose),
        gt(authCodes.createdAt, oneHourAgo),
      ),
    )
    .orderBy(desc(authCodes.createdAt));

  const newest = recent[0];
  if (newest) {
    const sinceMs = now.getTime() - newest.createdAt.getTime();
    if (sinceMs < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - sinceMs) / 1000),
      };
    }
  }
  if (recent.length >= MAX_CODES_PER_HOUR) {
    const oldest = recent[recent.length - 1];
    const windowResetMs =
      oldest.createdAt.getTime() + 60 * 60 * 1000 - now.getTime();
    return {
      ok: false,
      reason: "too_many",
      retryAfterSeconds: Math.max(60, Math.ceil(windowResetMs / 1000)),
    };
  }

  // Retire prior codes — only the newest is ever valid.
  await db
    .update(authCodes)
    .set({ consumedAt: now })
    .where(
      and(
        eq(authCodes.email, email),
        eq(authCodes.purpose, purpose),
        isNull(authCodes.consumedAt),
      ),
    );

  const code = generateSixDigitCode();
  await db.insert(authCodes).values({
    id: crypto.randomUUID(),
    userId,
    email,
    purpose,
    codeHash: hashCode(code),
    attempts: 0,
    expiresAt: new Date(now.getTime() + CODE_TTL_MS),
    createdAt: now,
  });

  return { ok: true, code, expiresAt: new Date(now.getTime() + CODE_TTL_MS) };
}

export type ConsumeCodeResult =
  | { ok: true; userId: string }
  | {
      ok: false;
      reason: "not_found" | "expired" | "invalid" | "attempts_exceeded";
      attemptsRemaining?: number;
    };

/**
 * Validate a presented code against the newest unconsumed row for
 * (email, purpose). Wrong guesses increment attempts; the 5th wrong guess
 * consumes the code. A correct guess consumes it too (single-use).
 */
export async function consumeAuthCode(
  email: string,
  purpose: AuthCodePurpose,
  code: string,
): Promise<ConsumeCodeResult> {
  const now = new Date();

  const [row] = await db
    .select()
    .from(authCodes)
    .where(
      and(
        eq(authCodes.email, email),
        eq(authCodes.purpose, purpose),
        isNull(authCodes.consumedAt),
      ),
    )
    .orderBy(desc(authCodes.createdAt))
    .limit(1);

  if (!row) return { ok: false, reason: "not_found" };
  if (row.expiresAt < now) return { ok: false, reason: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "attempts_exceeded" };
  }

  if (hashCode(code) !== row.codeHash) {
    const attempts = row.attempts + 1;
    const exhausted = attempts >= MAX_ATTEMPTS;
    await db
      .update(authCodes)
      .set(exhausted ? { attempts, consumedAt: now } : { attempts })
      .where(eq(authCodes.id, row.id));
    return exhausted
      ? { ok: false, reason: "attempts_exceeded" }
      : { ok: false, reason: "invalid", attemptsRemaining: MAX_ATTEMPTS - attempts };
  }

  await db
    .update(authCodes)
    .set({ consumedAt: now })
    .where(eq(authCodes.id, row.id));

  return { ok: true, userId: row.userId };
}
