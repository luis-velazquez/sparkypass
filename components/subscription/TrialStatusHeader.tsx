"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Clock, Zap } from "lucide-react";

export function TrialStatusHeader() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { subscriptionStatus, trialEndsAt } = session.user;

  if (subscriptionStatus !== "trialing" || !trialEndsAt) return null;

  const trialEnd = new Date(trialEndsAt);
  const now = new Date();
  const msLeft = trialEnd.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  const totalDays = 7;
  const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

  if (daysLeft <= 0) return null;

  return (
    <div className="rounded-lg border border-amber/20 dark:border-amber/20 bg-amber/5 dark:bg-amber/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber dark:text-amber-light" />
          <span className="text-sm font-medium text-foreground">
            Free Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
          </span>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber dark:text-amber-light hover:text-amber-dark dark:hover:text-amber transition-colors"
        >
          <Zap className="h-3 w-3" />
          Upgrade
        </Link>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted dark:bg-stone-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber dark:bg-amber transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        {daysLeft <= 2
          ? "Your trial is almost over — subscribe to keep full access."
          : "Enjoying SparkyPass? Subscribe anytime to continue after your trial."}
      </p>
    </div>
  );
}
