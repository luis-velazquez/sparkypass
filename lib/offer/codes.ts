// One-time App Store offer codes: the pool imported from App Store Connect
// (scripts/import-offer-codes.mjs) and the one code each user is given.

import { and, asc, count, eq, gt, isNull } from "drizzle-orm";
import { db, offerCodes } from "@/lib/db";
import { CODE_MIN_DAYS_LEFT, offerPriceText, redeemUrl } from "./config";
import { offerDeadline } from "./schedule";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface GivenCode {
  code: string;
  givenAt: Date;
}

/** The code already given to this user, if any. */
export async function codeForUser(userId: string): Promise<GivenCode | null> {
  const [row] = await db
    .select({ code: offerCodes.code, givenAt: offerCodes.givenAt })
    .from(offerCodes)
    .where(eq(offerCodes.userId, userId))
    .limit(1);
  return row?.givenAt ? { code: row.code, givenAt: row.givenAt } : null;
}

/**
 * Give this user one unused code that stays valid long enough to use, or
 * return the one they already have. Returns null when the pool is empty.
 * The update only claims a code that is still free, so two runs at once can't
 * hand the same code to two people.
 */
export async function giveCode(userId: string, now = new Date()): Promise<GivenCode | null> {
  const existing = await codeForUser(userId);
  if (existing) return existing;
  const minExpiry = new Date(now.getTime() + CODE_MIN_DAYS_LEFT * DAY_MS);
  for (let attempt = 0; attempt < 3; attempt++) {
    const [candidate] = await db
      .select({ code: offerCodes.code })
      .from(offerCodes)
      .where(and(isNull(offerCodes.userId), gt(offerCodes.expiresAt, minExpiry)))
      .orderBy(asc(offerCodes.expiresAt), asc(offerCodes.code))
      .limit(1);
    if (!candidate) return null;
    const claimed = await db
      .update(offerCodes)
      .set({ userId, givenAt: now })
      .where(and(eq(offerCodes.code, candidate.code), isNull(offerCodes.userId)))
      .returning({ code: offerCodes.code });
    if (claimed.length === 1) return { code: candidate.code, givenAt: now };
  }
  return null;
}

/** Unused codes that are still valid long enough to give out. */
export async function codesLeft(now = new Date()): Promise<number> {
  const minExpiry = new Date(now.getTime() + CODE_MIN_DAYS_LEFT * DAY_MS);
  const [row] = await db
    .select({ n: count() })
    .from(offerCodes)
    .where(and(isNull(offerCodes.userId), gt(offerCodes.expiresAt, minExpiry)));
  return Number(row?.n ?? 0);
}

export interface ActiveOffer {
  code: string;
  useBy: string;
  redeemUrl: string;
  priceText: string;
}

/**
 * The offer the app shows on the paywall (E-09): only while the user's code is
 * before its use-by date and they aren't Pro. `isPro` comes from the caller's
 * own reading of the subscription status.
 */
export async function activeOffer(
  userId: string,
  isPro: boolean,
  now = new Date(),
): Promise<ActiveOffer | null> {
  if (isPro) return null;
  const given = await codeForUser(userId);
  if (!given) return null;
  const useBy = offerDeadline(given.givenAt);
  if (useBy.getTime() <= now.getTime()) return null;
  return {
    code: given.code,
    useBy: useBy.toISOString(),
    redeemUrl: redeemUrl(given.code),
    priceText: offerPriceText(),
  };
}
