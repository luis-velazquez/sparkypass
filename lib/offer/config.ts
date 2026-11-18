// Settings for the $0.99 first-month offer. Everything that changes per launch
// lives in environment variables, so turning the job on or off, or changing
// the daily cap, needs no code change.
//
//   OFFER_EMAILS_ENABLED   "true" to send for real. Anything else = test mode:
//                          the job only reports who would get what.
//   MAILING_ADDRESS        postal address for the footer (US anti-spam law,
//                          plan E-04). Live sends refuse to run without it.
//   OFFER_REPLY_TO         where replies go. Default info@sparkypass.com.
//   OFFER_EMAIL_FROM       full From header. Default: "SparkyPass" with
//                          EMAIL_FROM's address.
//   OFFER_DAILY_CAP        offer emails per day (default 60; Resend's free
//                          plan allows 100 a day, sign-up emails included).
//   OFFER_PRICE_TEXT       the offer price as shown (default "$0.99"). It must
//                          match the offer in App Store Connect.
//   OFFER_TEST_TO          the one address test copies may go to.

import { APP_STORE_ID, INFO_EMAIL, PRO_PRICE } from "@/lib/site";

export const OFFER_STUDIED_THRESHOLD = 20; // email 2A at 20+ free-week answers, else 2B (E-11)
export const LOW_CODE_WARNING = 50;
/** A code must stay valid at least this long after it's given. */
export const CODE_MIN_DAYS_LEFT = 14;

export const offerEnabled = () => process.env.OFFER_EMAILS_ENABLED === "true";

export const dailyCap = () => {
  const n = Number(process.env.OFFER_DAILY_CAP);
  return Number.isInteger(n) && n >= 0 ? n : 60;
};

export const offerPriceText = () => process.env.OFFER_PRICE_TEXT?.trim() || "$0.99";
export const fullPriceText = () => PRO_PRICE;

export const mailingAddress = () => process.env.MAILING_ADDRESS?.trim() || null;

export const replyTo = () => process.env.OFFER_REPLY_TO?.trim() || INFO_EMAIL;

/** "SparkyPass <hello@…>", using the verified address from EMAIL_FROM. */
export function offerFrom(): string | null {
  const explicit = process.env.OFFER_EMAIL_FROM?.trim();
  if (explicit) return explicit;
  const base = process.env.EMAIL_FROM?.trim();
  if (!base) return null;
  const match = base.match(/<([^>]+)>/);
  const address = (match ? match[1] : base).trim();
  if (!address.includes("@")) return null;
  return `SparkyPass <${address}>`;
}

export function redeemUrl(code: string): string {
  return `https://apps.apple.com/redeem?ctx=offercodes&id=${APP_STORE_ID}&code=${encodeURIComponent(code)}`;
}

/** Why live sending can't run, or [] when everything it needs is set. */
export function liveSendProblems(): string[] {
  const problems: string[] = [];
  if (!process.env.RESEND_API_KEY) problems.push("RESEND_API_KEY is not set");
  const from = offerFrom();
  if (!from) problems.push("EMAIL_FROM (or OFFER_EMAIL_FROM) is not set");
  else if (from.includes("resend.dev")) problems.push("the From address is Resend's test domain");
  if (!mailingAddress()) problems.push("MAILING_ADDRESS is not set (required in every offer email)");
  if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
    problems.push("NEXTAUTH_SECRET is not set (needed to sign unsubscribe links)");
  }
  return problems;
}
