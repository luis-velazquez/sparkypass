"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { ArticleBreaker } from "./ArticleBreaker";
import { ArticleDetail } from "./ArticleDetail";
import { StatusLegend } from "./StatusLegend";
import type { PowerGridCategory } from "@/app/api/power-grid/route";

interface PowerGridPanelProps {
  categories: PowerGridCategory[];
  overallProgress: number;
}

export function PowerGridPanel({ categories, overallProgress }: PowerGridPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Main Breaker — Overall progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900/80 p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-12 rounded bg-stone-800 dark:bg-stone-200 flex items-center justify-center">
            <Zap className="h-5 w-5 text-amber dark:text-stone-800" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">
              Main Breaker
            </h2>
            <p className="text-xs text-muted-foreground">Overall mastery across all NEC articles</p>
          </div>
          <span className="text-2xl font-bold font-mono text-foreground">
            {overallProgress}%
          </span>
        </div>

        {/* Main progress bar */}
        <div className="h-3 rounded-full bg-stone-300 dark:bg-stone-700 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className={`h-full rounded-full ${
              overallProgress >= 75
                ? "bg-emerald dark:bg-sparky-green"
                : overallProgress >= 50
                  ? "bg-amber"
                  : "bg-stone-500"
            }`}
          />
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <StatusLegend />
      </motion.div>

      {/* Category breakers grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat, index) => (
          <ArticleBreaker
            key={cat.slug}
            slug={cat.slug}
            name={cat.name}
            necArticle={cat.necArticle}
            status={cat.status}
            accuracy={cat.accuracy}
            totalAnswered={cat.totalAnswered}
            srsHealth={cat.srsHealth}
            srsDue={cat.srsDue}
            bestStreak={cat.bestStreak}
            breakerTripped={cat.breakerTripped}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === cat.slug ? null : cat.slug,
              )
            }
            index={index}
          />
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        {selectedCategory && (
          <ArticleDetail
            key={selectedCategory}
            categorySlug={selectedCategory}
            onClose={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
