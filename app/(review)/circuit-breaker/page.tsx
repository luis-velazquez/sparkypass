"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ChevronRight,
  Timer,
  Flame,
  BookOpen,
  Shield,
  Zap,
  Box,
  Cog,
  GitBranch,
  HardHat,
  Cable,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import { formatCooldown } from "@/lib/circuit-breaker";
import { ReviewPageShell, ReviewPageHeader, ReviewLoadingState } from "../shared";

const categoryIcons: Record<string, LucideIcon> = {
  "calculations-and-theory": BookOpen,
  "grounding-bonding": Shield,
  services: Zap,
  "box-fill": Box,
  "motors-and-generators": Cog,
  "transformer-sizing": GitBranch,
  "special-occupancies": HardHat,
  "wiring-methods": Cable,
};

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
    return <ReviewLoadingState color="text-red-500" />;
  }

  return (
    <ReviewPageShell>
      <ReviewPageHeader
        accentText="Circuit Breaker"
        title=""
        subtitle="Test your knowledge under pressure — 2 wrong answers and the breaker trips!"
        accentColor="text-red-500"
      />

      {trippedCount > 0 && (
        <p className="text-sm text-red-500 -mt-4 mb-6 font-medium">
          {trippedCount} breaker{trippedCount !== 1 ? "s" : ""} currently tripped
        </p>
      )}

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

      {/* Category List — matches quiz page card list style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 overflow-hidden divide-y divide-border dark:divide-stone-800">
          {breakers.map((breaker, index) => {
            const cat = CATEGORIES.find((c) => c.slug === breaker.categorySlug);
            const isLocked = breaker.isTripped;

            return (
              <motion.div
                key={breaker.categorySlug}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.04 }}
              >
                <Link
                  href={`/circuit-breaker/${breaker.categorySlug}`}
                  className="flex items-center gap-3 px-4 py-3 group transition-colors duration-200 hover:bg-amber/5 dark:hover:bg-sparky-green/5"
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 ${
                    isLocked
                      ? "bg-red-500/10"
                      : breaker.consecutiveWrong > 0
                        ? "bg-amber/10"
                        : "bg-emerald/10 dark:bg-sparky-green/10"
                  }`}>
                    {(() => {
                      const Icon = categoryIcons[breaker.categorySlug] ?? ShieldAlert;
                      const color = isLocked
                        ? "text-red-500"
                        : breaker.consecutiveWrong > 0
                          ? "text-amber"
                          : "text-emerald dark:text-sparky-green";
                      return <Icon className={`h-4.5 w-4.5 ${color}`} />;
                    })()}
                  </div>

                  {/* Name */}
                  <span className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">
                    {cat?.name || breaker.categorySlug}
                  </span>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isLocked ? (
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-500">
                        <Timer className="h-3 w-3" />
                        {formatCooldown(breaker.cooldownRemaining)}
                      </span>
                    ) : breaker.consecutiveWrong > 0 ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-amber">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
                        </span>
                        Warning
                      </span>
                    ) : null}
                    {breaker.bestStreak > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {breaker.bestStreak}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {breaker.totalAttempts} Qs
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </Card>
      </motion.div>
    </ReviewPageShell>
  );
}
