"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Zap,
  Check,
  Loader2,
  Tag,
  Crown,
  Clock,
  Shield,
  Infinity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SparkyMessage } from "@/components/sparky";

const plans = [
  {
    key: "quarterly" as const,
    name: "Quarterly",
    price: "$79.99",
    interval: "every 3 months",
    perMonth: "$26.66/mo",
    tagline: "Perfect for focused exam prep",
    features: [
      "Full access to all quiz categories",
      "Flashcards & mock exams",
      "Load calculator tools",
      "Progress tracking & streaks",
      "Daily challenges",
    ],
  },
  {
    key: "yearly" as const,
    name: "Yearly",
    price: "$299.99",
    interval: "per year",
    perMonth: "$25.00/mo",
    tagline: "Our most popular comprehensive study track",
    badge: "Recommended",
    features: [
      "Everything in Quarterly",
      "Best value for long-term study",
      "Lock in the lowest recurring price",
      "Priority support",
    ],
  },
  {
    key: "lifetime" as const,
    name: "Lifetime",
    price: "$499.99",
    interval: "one-time",
    perMonth: "Pay once, access forever",
    tagline: "Includes all future NEC Code Cycles",
    badge: "Best Deal",
    icon: Infinity,
    features: [
      "Everything in Yearly",
      "2026, 2029, 2032+ NEC updates included",
      "Never pay again",
      "Founding member benefits",
    ],
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscriptionStatus = session?.user?.subscriptionStatus;
  const trialEndsAt = session?.user?.trialEndsAt;

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSubscribe = async (planKey: string) => {
    if (status !== "authenticated") {
      router.push("/register");
      return;
    }

    setLoadingPlan(planKey);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
          promoCode: promoCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "No checkout URL returned. Please try again.");
        setLoadingPlan(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-12">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Invest in Your Career
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need to pass the NEC exam. Quizzes, flashcards, mock exams,
          and load calculators — all in one platform.
        </p>
      </motion.div>

      {/* No card required callout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative z-10 text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald/10 border border-emerald/20 text-emerald dark:bg-sparky-green/10 dark:border-sparky-green/20 dark:text-sparky-green text-sm font-medium">
          <Shield className="h-4 w-4" />
          7-day free trial — no credit card required
        </div>
      </motion.div>

      {/* Trial / Status Banner */}
      {status === "authenticated" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="relative z-10 max-w-4xl mx-auto mb-8"
        >
          {subscriptionStatus === "trialing" && trialDaysLeft > 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber/10 border border-amber/20 text-amber-dark dark:text-amber">
              <Clock className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Your free trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}. Subscribe now to keep your access!
              </p>
            </div>
          ) : subscriptionStatus === "active" ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald/10 border border-emerald/20 text-emerald dark:bg-sparky-green/10 dark:border-sparky-green/20 dark:text-sparky-green">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                You have an active subscription. You&apos;re all set!
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <Zap className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Your free trial has ended. Subscribe below to regain access to all study materials.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="relative z-10 max-w-4xl mx-auto mb-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            <Zap className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className="relative z-10 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
          >
            <Card className={`relative h-full flex flex-col border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] ${plan.key === "lifetime" ? "border-sparky-green/40 dark:border-sparky-green/50 shadow-[0_0_24px_rgba(163,255,0,0.1)] hover:border-sparky-green/60 hover:shadow-[0_0_30px_rgba(163,255,0,0.18)]" : plan.badge ? "border-amber shadow-lg shadow-amber/10 scale-[1.02]" : ""}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-semibold ${plan.key === "lifetime" ? "bg-sparky-green text-stone-950 shadow-[0_0_12px_rgba(163,255,0,0.3)]" : "bg-amber text-white"}`}>
                    <Crown className="h-3 w-3" />
                    {plan.badge}
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-3">
                  <span className={`text-4xl font-bold ${plan.key === "lifetime" ? "text-sparky-green" : "text-foreground"}`}>{plan.price}</span>
                  <span className="text-muted-foreground ml-1 text-sm">/{plan.interval}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.perMonth}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">{plan.tagline}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loadingPlan !== null || subscriptionStatus === "active"}
                  className={`w-full ${plan.key === "lifetime" ? "bg-sparky-green hover:bg-sparky-green-dark text-stone-950 font-bold shadow-[0_0_20px_rgba(163,255,0,0.25)] hover:shadow-[0_0_30px_rgba(163,255,0,0.4)]" : plan.badge ? "bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 shadow-md" : "bg-purple hover:bg-purple-dark text-white"}`}
                >
                  {loadingPlan === plan.key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : subscriptionStatus === "active" ? (
                    "Current Plan"
                  ) : status !== "authenticated" ? (
                    "Start Free Trial"
                  ) : (
                    "Select Plan"
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Promo Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative z-10 max-w-md mx-auto mb-10"
      >
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Have a promo code? Enter it here"
            className="text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          The discount will be applied at checkout.
        </p>
      </motion.div>

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="relative z-10 max-w-2xl mx-auto"
      >
        <SparkyMessage
          size="medium"
          message="Investing in your education is the best circuit you'll ever complete! Every licensed electrician started right where you are."
        />
      </motion.div>
    </main>
  );
}
