// Unsubscribe from offer emails. Every offer email carries a signed link (the
// user id plus an HMAC of it), so the link works without signing in and can't
// be forged for someone else. The key is derived from NEXTAUTH_SECRET with
// its own label, so it can't be swapped for any other token the server signs.
//
// Unsubscribing sets notification_prefs.offerEmails.enabled = false. The
// daily job then sends no offer email and no offer push to that user.

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

const LABEL = "sparkypass/offer-unsubscribe/v1:";

function key(): string | null {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || null;
}

export function unsubscribeToken(userId: string): string {
  const k = key();
  if (!k) throw new Error("NEXTAUTH_SECRET is not set");
  return crypto.createHmac("sha256", k).update(LABEL + userId).digest("base64url").slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (!key() || !userId || !token) return false;
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

function query(userId: string): string {
  return `u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
}

/** The page link in the email footer (shows a confirm button). */
export function unsubscribePageUrl(userId: string): string {
  return `${SITE_URL}/unsubscribe?${query(userId)}`;
}

/** The one-click address for the List-Unsubscribe header (RFC 8058). */
export function oneClickUrl(userId: string): string {
  return `${SITE_URL}/api/email/unsubscribe?${query(userId)}`;
}

/** True when the user turned offer emails off. Unknown or missing = on. */
export function offerEmailsOff(rawPrefs: string | null): boolean {
  if (!rawPrefs) return false;
  try {
    const prefs = JSON.parse(rawPrefs) as { offerEmails?: { enabled?: boolean } };
    return prefs.offerEmails?.enabled === false;
  } catch {
    return false;
  }
}

/** Turn offer emails off, keeping every other notification setting. */
export async function setOfferEmailsOff(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ prefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return false;
  let prefs: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(row.prefs || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) prefs = parsed;
  } catch {
    /* a broken blob is replaced */
  }
  prefs.offerEmails = { enabled: false, changedAt: new Date().toISOString() };
  await db
    .update(users)
    .set({ notificationPrefs: JSON.stringify(prefs), updatedAt: new Date() })
    .where(eq(users.id, userId));
  return true;
}
