import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Verify the checkout belongs to this user
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user?.stripeCustomerId !== checkoutSession.customer) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    // Update subscription status
    const subscriptionId = checkoutSession.subscription as string | null;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const firstItem = subscription.items.data[0];
      const periodEnd = new Date(firstItem.current_period_end * 1000);

      await db
        .update(users)
        .set({
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: "active",
          subscriptionPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));
    } else {
      // Lifetime / one-time payment
      await db
        .update(users)
        .set({
          subscriptionStatus: "active",
          subscriptionPeriodEnd: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));
    }

    return NextResponse.json({ status: "active" });
  } catch (error) {
    console.error("Verify session error:", error);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
