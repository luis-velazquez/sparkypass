"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const confettiFired = useRef(false);
  const verified = useRef(false);

  useEffect(() => {
    // Verify the checkout session, refresh the JWT, then redirect
    const sessionId = searchParams.get("session_id");
    if (sessionId && !verified.current) {
      verified.current = true;
      fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then(async (res) => {
          if (res.ok) {
            // Force session refresh so the JWT cookie gets the new subscriptionStatus
            await updateSession();
          }
        })
        .catch(console.error);
    }

    // Fire confetti once
    if (!confettiFired.current) {
      confettiFired.current = true;
      import("canvas-confetti").then((mod) => {
        const confetti = mod.default;
        // First burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#a855f7", "#10b981", "#3b82f6"],
        });
        // Second burst
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#f59e0b", "#a855f7", "#10b981"],
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#f59e0b", "#a855f7", "#10b981"],
          });
        }, 300);
      });
    }

    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, searchParams, updateSession]);

  return (
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-16">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative z-10 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <CheckCircle2 className="h-20 w-20 text-emerald mx-auto" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-display font-bold text-foreground mb-3"
        >
          You&apos;re All Set!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-muted-foreground text-lg mb-8"
        >
          Your subscription is active. Full access to all study materials is unlocked.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Redirecting automatically in a few seconds...
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SparkyMessage
            size="medium"
            message="Welcome to the SparkyPass family! Time to hit the books and crush that exam. I believe in you!"
          />
        </motion.div>
      </div>
    </main>
  );
}
