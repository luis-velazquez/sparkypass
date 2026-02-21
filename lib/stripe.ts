import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
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
