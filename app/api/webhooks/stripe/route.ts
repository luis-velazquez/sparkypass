import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { pushSubscriberAttributes } from "@/lib/revenuecat";

export const dynamic = "force-dynamic";

function getPeriodEnd(subscription: Stripe.Subscription): Date {
  // In Stripe v20+, period info is on subscription items
  const firstItem = subscription.items.data[0];
  return new Date(firstItem.current_period_end * 1000);
}

// After every Stripe-driven users-row mutation, fire-and-forget mirror to RC.
// Per audit OQ#1: RC is the cross-platform source of truth; we keep users row
// as fast local cache + read fallback. Errors are logged, not propagated —
// Stripe webhook MUST return 2xx fast or Stripe retries (causing duplicate
// state mutations).
async function mirrorStripeToRC(
  rowsAffected: Array<{ id: string }>,
  attrs: {
    subscriptionStatus: string;
    subscriptionPeriodEnd?: Date | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  },
): Promise<void> {
  // Run pushes in parallel; we typically have 0 or 1 user affected.
  await Promise.all(
    rowsAffected.map((r) =>
      pushSubscriberAttributes(r.id, { ...attrs, subscriptionSource: "stripe" }).catch(
        (err) => console.error("[stripe-webhook] RC mirror failed:", err),
      ),
    ),
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        if (!customerId) break;

        if (subscriptionId) {
          // Subscription plan (quarterly/yearly)
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = getPeriodEnd(subscription);

          const affected = await db
            .update(users)
            .set({
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: "active",
              subscriptionSource: "stripe",
              subscriptionPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, customerId))
            .returning({ id: users.id });

          await mirrorStripeToRC(affected, {
            subscriptionStatus: "active",
            subscriptionPeriodEnd: periodEnd,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
        } else {
          // One-time payment (lifetime) — no subscription, no period end
          const affected = await db
            .update(users)
            .set({
              subscriptionStatus: "active",
              subscriptionSource: "stripe",
              subscriptionPeriodEnd: null,
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, customerId))
            .returning({ id: users.id });

          await mirrorStripeToRC(affected, {
            subscriptionStatus: "active",
            subscriptionPeriodEnd: null,
            stripeCustomerId: customerId,
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "past_due",
          incomplete: "past_due",
          incomplete_expired: "expired",
        };

        const ourStatus = statusMap[subscription.status] || "expired";
        const periodEnd = getPeriodEnd(subscription);

        const affected = await db
          .update(users)
          .set({
            subscriptionStatus: ourStatus,
            subscriptionSource: "stripe",
            subscriptionPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeSubscriptionId, subscriptionId))
          .returning({ id: users.id });

        await mirrorStripeToRC(affected, {
          subscriptionStatus: ourStatus,
          subscriptionPeriodEnd: periodEnd,
          stripeSubscriptionId: subscriptionId,
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        const affected = await db
          .update(users)
          .set({
            subscriptionStatus: "expired",
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeSubscriptionId, subscriptionId))
          .returning({ id: users.id });

        await mirrorStripeToRC(affected, {
          subscriptionStatus: "expired",
          subscriptionPeriodEnd: null,
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          const affected = await db
            .update(users)
            .set({
              subscriptionStatus: "past_due",
              updatedAt: new Date(),
            })
            .where(eq(users.stripeCustomerId, customerId))
            .returning({ id: users.id });

          await mirrorStripeToRC(affected, {
            subscriptionStatus: "past_due",
            stripeCustomerId: customerId,
          });
        }

        break;
      }
    }
  } catch (err) {
    console.error("Error processing webhook event:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
