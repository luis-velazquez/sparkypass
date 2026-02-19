"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";

export function SubscriptionBanner() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { subscriptionStatus, trialEndsAt, subscriptionPeriodEnd } = session.user;

  // Trial ending soon (2 days or less)
  if (subscriptionStatus === "trialing" && trialEndsAt) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    if (daysLeft <= 2 && daysLeft > 0) {
      return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-amber/10 dark:bg-sparky-green/10 border border-amber/20 dark:border-sparky-green/20 text-amber-dark dark:text-sparky-green text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              Your trial ends in {daysLeft} day{daysLeft !== 1 ? "s" : ""}.
            </span>
          </div>
          <Link
            href="/pricing"
            className="font-semibold hover:underline whitespace-nowrap"
          >
            Subscribe now
          </Link>
        </div>
      );
    }
  }

  // Payment failed
  if (subscriptionStatus === "past_due") {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Payment failed. Update your billing info to keep access.</span>
        </div>
        <Link
          href="/settings"
          className="font-semibold hover:underline whitespace-nowrap"
        >
          Update billing
        </Link>
      </div>
    );
  }

  // Canceled but still has access until period end
  if (subscriptionStatus === "canceled" && subscriptionPeriodEnd) {
    const endDate = new Date(subscriptionPeriodEnd);
    if (endDate > new Date()) {
      return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-amber/10 dark:bg-sparky-green/10 border border-amber/20 dark:border-sparky-green/20 text-amber-dark dark:text-sparky-green text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 flex-shrink-0" />
            <span>
              Your subscription was canceled. Access until{" "}
              {endDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              .
            </span>
          </div>
          <Link
            href="/pricing"
            className="font-semibold hover:underline whitespace-nowrap"
          >
            Resubscribe
          </Link>
        </div>
      );
    }
  }

  return null;
}
