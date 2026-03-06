"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Flame,
  Loader2,
  RotateCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string | null;
}

const TYPE_CONFIG: Record<string, { icon: typeof Zap; color: string }> = {
  // New system types
  quiz_complete: { icon: BookOpen, color: "text-sky-500" },
  daily_challenge: { icon: Flame, color: "text-orange-500" },
  review_complete: { icon: RotateCcw, color: "text-purple-500" },
  circuit_breaker_clear: { icon: CheckCircle2, color: "text-emerald-500" },
  index_game: { icon: BookOpen, color: "text-amber dark:text-sparky-green" },
  streak_milestone: { icon: Flame, color: "text-orange-500" },
  resistance_no_login: { icon: TrendingDown, color: "text-rose-500" },
  resistance_missed_review: { icon: TrendingDown, color: "text-rose-500" },
  power_up_purchase: { icon: ShoppingCart, color: "text-purple-500" },
  // Legacy types (old DB rows)
  correct_answer: { icon: CheckCircle2, color: "text-emerald-500" },
  session_complete: { icon: BookOpen, color: "text-sky-500" },
  breaker_reset: { icon: RotateCcw, color: "text-rose-500" },
  migration: { icon: ArrowRightLeft, color: "text-muted-foreground" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: Zap, color: "text-amber dark:text-sparky-green" };
}

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

export default function WattsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [wattsBalance, setWattsBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchTransactions = useCallback(() => {
    return fetch("/api/watts/transactions")
      .then((res) => res.json())
      .then((data) => {
        setWattsBalance(data.wattsBalance ?? 0);
        setTransactions(data.transactions ?? []);
        return data.wattsBalance ?? 0;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Initial load — sync UserMenu with fresh DB balance
  useEffect(() => {
    if (status !== "authenticated") return;
    fetchTransactions().then((balance) => {
      if (typeof balance === "number") {
        window.dispatchEvent(new CustomEvent("watts-updated", { detail: balance }));
      }
    });
  }, [status, fetchTransactions]);

  // Re-fetch when watts change elsewhere (e.g. power-up purchase, quiz answer)
  // No dispatch needed — the source event already updated the UserMenu
  useEffect(() => {
    const handler = () => fetchTransactions();
    window.addEventListener("watts-updated", handler);
    return () => window.removeEventListener("watts-updated", handler);
  }, [fetchTransactions]);

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  const totalEarned = transactions.reduce((sum, t) => (t.amount > 0 ? sum + t.amount : sum), 0);
  const totalSpent = transactions.reduce((sum, t) => (t.amount < 0 ? sum + Math.abs(t.amount) : sum), 0);

  const sparkyMessage =
    transactions.length === 0
      ? "Start studying to earn Watts! Every correct answer powers up your balance."
      : `You've earned ${totalEarned.toLocaleString()}W and spent ${totalSpent.toLocaleString()}W across your last ${transactions.length} transactions.`;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              <span className="text-amber dark:text-sparky-green">Watts Bank</span>
            </h1>
            <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber/10 text-amber dark:bg-sparky-green/10 dark:text-sparky-green text-sm font-semibold">
              <Zap className="h-4 w-4 fill-current" />
              {wattsBalance.toLocaleString()}W
            </span>
          </div>
        </motion.div>

        {/* Sparky message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6"
        >
          <SparkyMessage size="medium" message={sparkyMessage} />
        </motion.div>

        {/* Summary card */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-border dark:border-stone-800">
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Earned</p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{totalEarned.toLocaleString()}W
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                        -{totalSpent.toLocaleString()}W
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Last {transactions.length} transactions</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Transaction list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((t) => {
                const config = getTypeConfig(t.type);
                const Icon = config.icon;
                const isPositive = t.amount > 0;

                return (
                  <Card key={t.id} className="border-border dark:border-stone-800">
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className={`shrink-0 ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {t.description || formatType(t.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.createdAt
                            ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })
                            : "Unknown"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {t.amount.toLocaleString()}W
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {t.balanceAfter.toLocaleString()}W
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-border dark:border-stone-800 border-dashed">
              <CardContent className="py-12 text-center">
                <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No transactions yet. Start studying to earn Watts!
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </main>
  );
}
