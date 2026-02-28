"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Zap } from "lucide-react";
import { SparkyMessage } from "@/components/sparky";
import { getPowerGridReaction } from "@/lib/sparky-messages";
import { PowerGridPanel } from "@/components/power-grid";
import type { PowerGridCategory } from "@/app/api/power-grid/route";

export default function PowerGridPage() {
  const { status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<PowerGridCategory[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [stats, setStats] = useState({ energized: 0, brownedOut: 0, deEnergized: 0, flickering: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/power-grid")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setOverallProgress(data.overallProgress || 0);
        setStats({
          energized: data.energizedCount || 0,
          brownedOut: data.brownedOutCount || 0,
          deEnergized: data.deEnergizedCount || 0,
          flickering: data.flickeringCount || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  const sparkyReaction = getPowerGridReaction(stats.energized, categories.length, stats.flickering);

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10">
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
              <span className="text-emerald dark:text-sparky-green">Power</span> Grid
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your NEC mastery at a glance — energize every circuit to master the code.
          </p>

          {/* Status summary chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {stats.energized > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green font-medium">
                {stats.energized} Energized
              </span>
            )}
            {stats.brownedOut > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber/10 text-amber font-medium">
                {stats.brownedOut} Browned Out
              </span>
            )}
            {stats.flickering > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber/10 text-amber font-medium animate-pulse">
                {stats.flickering} Flickering
              </span>
            )}
            {stats.deEnergized > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                {stats.deEnergized} De-energized
              </span>
            )}
          </div>
        </motion.div>

        {/* Sparky message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-8"
        >
          <SparkyMessage size="medium" message={sparkyReaction.message} variant={sparkyReaction.variant} />
        </motion.div>

        {/* Power Grid Panel */}
        <PowerGridPanel categories={categories} overallProgress={overallProgress} />
      </div>
    </main>
  );
}
