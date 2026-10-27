/**
 * Single source of truth for promotional-site facts.
 * Every number or claim here must match App Store Connect and the shipped app.
 */
export const SITE_URL = "https://sparkypass.com";
export const SITE_NAME = "SparkyPass";
export const LEGAL_ENTITY = "SparkyPass LLC";
export const SUPPORT_EMAIL = "support@sparkypass.com";

export const APP_STORE_ID = "6801112841";
export const APP_STORE_URL = `https://apps.apple.com/us/app/sparkypass/id${APP_STORE_ID}`;
export const APP_BUNDLE_ID = "com.sparkypass.app";
export const MIN_IOS = "16.4";

export const PRO_PRICE = "$14.99";
export const PRO_PERIOD = "month";
export const TRIAL_DAYS = 7;

export const QUESTION_COUNT_LABEL = "550+";
export const FREE_QUESTION_COUNT = 60;
export const NEC_EDITIONS = ["2023", "2026"] as const;

export const PRACTICE_HUB_PATH = "/free-journeyman-electrician-practice-test";

/** Pace target used across the site and the app: three minutes per question. */
export const EXAM_SECONDS_PER_QUESTION = 180;

/** Bump when public page content changes; used for sitemap lastModified. */
export const CONTENT_UPDATED = "2026-10-27";

export const NFPA_DISCLAIMER =
  "SparkyPass is an independent study tool. It is not affiliated with, endorsed by, or sponsored by the National Fire Protection Association. NEC and National Electrical Code are registered trademarks of the NFPA.";

export const APPLE_LEGAL =
  "Apple, the Apple logo, and iPhone are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc., registered in the U.S. and other countries.";

export const SUBSCRIPTION_DISCLOSURE = `Full access is ${PRO_PRICE}/${PRO_PERIOD}, auto-renewing. New subscribers get a ${TRIAL_DAYS}-day free trial, then ${PRO_PRICE}/${PRO_PERIOD}. Cancel anytime in your App Store settings. Payment is charged to your Apple Account at confirmation of purchase; the subscription renews unless cancelled at least 24 hours before the end of the period.`;
