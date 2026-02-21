import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, promoCode } = body as { plan: PlanKey; promoCode?: string };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get or create Stripe customer
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      await db
        .update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, session.user.id));
    }

    // Build checkout session params
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const selectedPlan = PLANS[plan];

    const params: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      mode: selectedPlan.mode,
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { plan },
    };

    // If promo code provided, look it up and apply as discount
    if (promoCode) {
      try {
        const promoCodes = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          limit: 1,
        });

        if (promoCodes.data.length > 0) {
          params.discounts = [{ promotion_code: promoCodes.data[0].id }];
        } else {
          params.allow_promotion_codes = true;
        }
      } catch {
        params.allow_promotion_codes = true;
      }
    } else {
      params.allow_promotion_codes = true;
    }

    const checkoutSession = await stripe.checkout.sessions.create(params);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
