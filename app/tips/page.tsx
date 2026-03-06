"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  Loader2,
  Lightbulb,
  Lock,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { getAllTips, getSeenTipIds } from "@/lib/tips";
import type { Tip } from "@/types/tip";

export default function TipsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [seenIds, setSeenIds] = useState<string[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    setSeenIds(getSeenTipIds());
  }, []);

  const allTips = getAllTips();

  if (status === "loading" || seenIds === null) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  const unlockedTips = allTips.filter((t) => seenIds.includes(t.id));
  const lockedTips = allTips.filter((t) => !seenIds.includes(t.id));
  const unlockedCount = unlockedTips.length;
  const totalCount = allTips.length;
  const allUnlocked = unlockedCount === totalCount;

  const sparkyMessage =
    unlockedCount === 0
      ? "Your tip vault is empty! Head to the Power-Ups shop and spend some Watts to unlock NEC pro tips from Sparky's vault."
      : allUnlocked
        ? "You've unlocked every tip in the vault! You're a true NEC scholar. Review them anytime to keep that knowledge sharp."
        : `You've unlocked ${unlockedCount} of ${totalCount} tips! Keep earning Watts and visit the Power-Ups shop to unlock more.`;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
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
              <span className="text-amber dark:text-sparky-green">
                Sparky&apos;s Tip Vault
              </span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            {unlockedCount} / {totalCount} unlocked
          </p>
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

        {/* Tip cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          {/* Unlocked tips */}
          {unlockedTips.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              expanded={expandedId === tip.id}
              onToggle={() =>
                setExpandedId(expandedId === tip.id ? null : tip.id)
              }
            />
          ))}

          {/* Locked tips */}
          {lockedTips.map((tip) => (
            <LockedTipCard key={tip.id} />
          ))}
        </motion.div>

        {/* CTA card */}
        {!allUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6"
          >
            <Card className="border-amber/30 dark:border-sparky-green/20 bg-amber/5 dark:bg-sparky-green/5">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber dark:text-sparky-green fill-current" />
                  <p className="text-sm font-medium text-foreground">
                    Want more tips?
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Each Sparky Tip costs 50W from the Power-Ups shop.
                </p>
                <Link
                  href="/power-ups"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 transition-colors"
                >
                  Visit Power-Ups Shop
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function TipCard({
  tip,
  expanded,
  onToggle,
}: {
  tip: Tip;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="border-border dark:border-stone-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-amber/20 dark:bg-sparky-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb className="h-4 w-4 text-amber dark:text-sparky-green" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground leading-tight">
            {tip.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-amber/10 dark:bg-sparky-green/10 text-amber dark:text-sparky-green text-xs font-medium">
              {tip.category}
            </span>
            <span className="text-xs text-muted-foreground">
              {tip.necReference}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border dark:border-stone-800">
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pt-4">
            {tip.content}
          </p>

          {tip.formulas && tip.formulas.length > 0 && (
            <div className="space-y-2">
              {tip.formulas.map((formula, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-amber/10 dark:bg-sparky-green/10 border border-amber/20 dark:border-sparky-green/20"
                >
                  <code className="text-sm font-mono font-semibold text-amber dark:text-sparky-green">
                    {formula}
                  </code>
                </div>
              ))}
            </div>
          )}

          <div className="px-3 py-2.5 rounded-lg bg-purple/10 dark:bg-purple/10 border border-purple/20 dark:border-purple/20">
            <p className="text-sm font-medium text-purple dark:text-purple-light">
              <span className="font-bold">Sparky&apos;s Bottom Line:</span>{" "}
              {tip.sparkyBottomLine}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function LockedTipCard() {
  return (
    <Card className="border-border dark:border-stone-800 opacity-50">
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Locked Tip
          </p>
          <p className="text-xs text-muted-foreground/70">
            Purchase from the Power-Ups shop to unlock
          </p>
        </div>
      </div>
    </Card>
  );
}
