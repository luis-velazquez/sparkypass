"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Zap,
  Timer,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import { formatCooldown } from "@/lib/circuit-breaker";

interface BreakerStatus {
  categorySlug: string;
  categoryName: string;
  consecutiveWrong: number;
  isTripped: boolean;
  cooldownRemaining: number;
  totalAttempts: number;
  totalTrips: number;
  currentStreak: number;
  bestStreak: number;
  canReset: boolean;
  resetCost: number;
}

export default function CircuitBreakerPage() {
  const { status } = useSession();
  const router = useRouter();
  const [breakers, setBreakers] = useState<BreakerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [trippedCount, setTrippedCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/circuit-breaker/status")
      .then((res) => res.json())
      .then((data) => {
        setBreakers(data.breakers || []);
        setTrippedCount(data.trippedCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              <span className="text-red-500">Circuit Breaker</span> Challenge
            </h1>
          </div>
          <p className="text-muted-foreground">
            Test your knowledge under pressure — 2 wrong answers and the breaker trips!
          </p>
          {trippedCount > 0 && (
            <p className="text-sm text-red-500 mt-1 font-medium">
              {trippedCount} breaker{trippedCount !== 1 ? "s" : ""} currently tripped
            </p>
          )}
        </motion.div>

        {/* Sparky Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-8"
        >
          <SparkyMessage
            size="medium"
            variant={trippedCount > 0 ? "warning" : "excited"}
            message={trippedCount > 0
              ? `${trippedCount} breaker${trippedCount !== 1 ? "s" : ""} currently tripped! Wait for cooldowns or spend Watts to reset. Focus on accuracy to avoid more trips.`
              : "Circuit Breaker Mode pushes your accuracy to the limit! Get 2 wrong in a row and the breaker trips — you'll have to wait 30 minutes or spend 100W to reset. Build long correct streaks to earn bonus Watts!"
            }
          />
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {breakers.map((breaker, index) => {
            const cat = CATEGORIES.find((c) => c.slug === breaker.categorySlug);
            const isLocked = breaker.isTripped;

            return (
              <motion.div
                key={breaker.categorySlug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.03 }}
              >
                <Link
                  href={
                    isLocked
                      ? `/circuit-breaker/${breaker.categorySlug}`
                      : `/circuit-breaker/${breaker.categorySlug}`
                  }
                >
                  <Card
                    className={`h-full cursor-pointer transition-all pressable ${
                      isLocked
                        ? "border-red-500/40 dark:border-red-500/30 bg-red-500/5 dark:bg-red-500/5 hover:border-red-500/60"
                        : breaker.consecutiveWrong > 0
                          ? "border-amber/40 dark:border-amber/30 hover:border-amber/60"
                          : "border-border dark:border-stone-800 hover:border-emerald/40 dark:hover:border-sparky-green/40"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isLocked ? (
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                          ) : (
                            <ShieldCheck className="h-5 w-5 text-emerald dark:text-sparky-green" />
                          )}
                          <h3 className="font-bold text-foreground text-sm">
                            {cat?.name || breaker.categorySlug}
                          </h3>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Status */}
                      {isLocked ? (
                        <div className="flex items-center gap-2 mb-3">
                          <Timer className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs font-mono text-red-500 font-bold">
                            {formatCooldown(breaker.cooldownRemaining)}
                          </span>
                          <span className="text-xs text-red-500">cooldown</span>
                        </div>
                      ) : breaker.consecutiveWrong > 0 ? (
                        <div className="flex items-center gap-1 mb-3">
                          <div className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                          <span className="text-xs text-amber font-medium">
                            Warning — {breaker.consecutiveWrong} wrong
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mb-3">
                          <div className="w-2 h-2 rounded-full bg-emerald dark:bg-sparky-green" />
                          <span className="text-xs text-emerald dark:text-sparky-green font-medium">
                            Active
                          </span>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {breaker.bestStreak > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            Best: {breaker.bestStreak}
                          </span>
                        )}
                        {breaker.totalTrips > 0 && (
                          <span>Trips: {breaker.totalTrips}</span>
                        )}
                        {breaker.totalAttempts > 0 && (
                          <span>{breaker.totalAttempts} attempts</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
