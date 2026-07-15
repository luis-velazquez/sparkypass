import Stripe from "stripe";

// Constructed lazily on first use: `new Stripe()` THROWS when the key is
// missing, and Next's build-time page-data collection evaluates this module
// for every route that imports it — a missing STRIPE_SECRET_KEY in the build
// environment must fail the Stripe CALL, not the whole deploy (this took
// down deploys on 2026-07-14).
let client: Stripe | null = null;
function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return client;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
});

export type PlanKey = "quarterly" | "yearly" | "lifetime";

export const PLANS: Record<
  PlanKey,
  {
    name: string;
    priceId: string;
    displayPrice: string;
    interval: string;
    description: string;
    mode: "subscription" | "payment";
  }
> = {
  quarterly: {
    name: "SparkyPass Quarterly",
    priceId: process.env.STRIPE_QUARTERLY_PRICE_ID!,
    displayPrice: "$79.99",
    interval: "every 3 months",
    description: "Perfect for focused exam prep",
    mode: "subscription",
  },
  yearly: {
    name: "SparkyPass Yearly",
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    displayPrice: "$299.99",
    interval: "per year",
    description: "Our most popular comprehensive study track",
    mode: "subscription",
  },
  lifetime: {
    name: "SparkyPass Lifetime",
    priceId: process.env.STRIPE_LIFETIME_PRICE_ID!,
    displayPrice: "$499.99",
    interval: "one-time",
    description: "All future NEC Code Cycles included",
    mode: "payment",
  },
};
