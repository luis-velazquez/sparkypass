// RevenueCat REST API client — minimal surface for keeping RC's view of a
// user in sync with our own when state changes outside the Apple IAP flow
// (e.g. on a Stripe subscription event).
//
// Per audit OQ#1 resolution, RC is the canonical source of truth for cross-
// platform entitlement. For the Apple side, RC sees events directly via Apple
// S2S → RC → our /api/webhooks/revenuecat. For Stripe (web), RC needs to be
// told. The most robust path is to configure RC's Stripe integration in their
// dashboard so RC pulls events directly; this helper exists as a backstop for
// when that integration is offline or when state diverges.
//
// If REVENUECAT_SECRET_API_KEY isn't set, all calls here are no-ops with a
// warning log — keeps local dev unblocked.

const RC_BASE_URL = "https://api.revenuecat.com/v1";

export interface SubscriberAttrs {
  subscriptionStatus: string;
  subscriptionSource: string;
  subscriptionPeriodEnd?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

/**
 * Push a set of subscriber attributes to RC. RC stores these as opaque
 * key/value tags on the subscriber profile — useful for analytics + dashboards
 * even when RC isn't the source of truth for the entitlement itself.
 *
 * Returns ok:true on 2xx; ok:false with the response error on failure.
 * Failures are non-fatal at the caller — RC is best-effort observability for
 * cross-platform users, not load-bearing logic.
 */
export async function pushSubscriberAttributes(
  appUserId: string,
  attrs: SubscriberAttrs,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey) {
    console.warn("[revenuecat] REVENUECAT_SECRET_API_KEY not set — skipping attribute push");
    return { ok: false, error: "RC_NOT_CONFIGURED" };
  }

  const body = {
    attributes: {
      subscription_status: { value: attrs.subscriptionStatus },
      subscription_source: { value: attrs.subscriptionSource },
      ...(attrs.subscriptionPeriodEnd && {
        subscription_period_end: { value: attrs.subscriptionPeriodEnd.toISOString() },
      }),
      ...(attrs.stripeCustomerId && {
        stripe_customer_id: { value: attrs.stripeCustomerId },
      }),
      ...(attrs.stripeSubscriptionId && {
        stripe_subscription_id: { value: attrs.stripeSubscriptionId },
      }),
    },
  };

  try {
    const response = await fetch(
      `${RC_BASE_URL}/subscribers/${encodeURIComponent(appUserId)}/attributes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Platform": "stripe",
        },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      const text = await response.text();
      console.error("[revenuecat] Attribute push failed:", response.status, text);
      return { ok: false, status: response.status, error: text };
    }
    return { ok: true, status: response.status };
  } catch (err) {
    console.error("[revenuecat] Network error pushing attributes:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
