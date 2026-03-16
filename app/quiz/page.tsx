"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Zap, Shield, ChevronRight, Box, Cog, GitBranch, Trophy, HardHat, Cable } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES, type Category } from "@/types/question";
import { getCategoryCounts } from "@/lib/questions";
import { useNecVersion } from "@/lib/nec-version";

interface QuizResultData {
  score: number;
  totalQuestions: number;
  percentage: number;
  bestStreak: number;
  completedAt: Date;
  highestPassedDifficulty: string | null;
  bestScoreAtHighest: number | null;
}

// Map category slugs to icons
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "calculations-and-theory": BookOpen,
  "grounding-bonding": Shield,
  services: Zap,
  "box-fill": Box,
  "motors-and-generators": Cog,
  "transformer-sizing": GitBranch,
  "special-occupancies": HardHat,
  "wiring-methods": Cable,
};

// Map category slugs to colors
const categoryColors = {
  "calculations-and-theory": {
    icon: "text-purple dark:text-purple-light",
    bg: "bg-purple-soft dark:bg-purple/10",
    border: "hover:border-purple/50",
  },
  "grounding-bonding": {
    icon: "text-emerald dark:text-sparky-green",
    bg: "bg-emerald/10 dark:bg-sparky-green/10",
    border: "hover:border-emerald/50 dark:hover:border-sparky-green/50",
  },
  services: {
    icon: "text-amber dark:text-amber-light",
    bg: "bg-amber/10",
    border: "hover:border-amber/50",
  },
  "box-fill": {
    icon: "text-cyan-500 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "hover:border-cyan-500/50",
  },
  "motors-and-generators": {
    icon: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "hover:border-indigo-500/50",
  },
  "transformer-sizing": {
    icon: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "hover:border-sky-500/50",
  },
  "special-occupancies": {
    icon: "text-fuchsia-500 dark:text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "hover:border-fuchsia-500/50",
  },
  "wiring-methods": {
    icon: "text-lime-600 dark:text-lime-400",
    bg: "bg-lime-600/10",
    border: "hover:border-lime-600/50",
  },
};

const QUIZ_STORAGE_PREFIX = "sparkypass-quiz-progress-";

export default function QuizPage() {
  const { necVersion } = useNecVersion();
  const categoryCounts = getCategoryCounts(necVersion);
  const [lastScores, setLastScores] = useState<Record<string, QuizResultData>>({});
  const [inProgressCategories, setInProgressCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/quiz-results")
      .then((res) => res.ok ? res.json() : {})
      .then((data) => setLastScores(data))
      .catch(() => {});

    // Check localStorage for in-progress quizzes
    const inProgress = new Set<string>();
    for (const cat of CATEGORIES) {
      try {
        const saved = localStorage.getItem(QUIZ_STORAGE_PREFIX + cat.slug);
        if (saved) {
          const parsed = JSON.parse(saved);
          const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
          const hasProgress = parsed.currentQuestionIndex > 0 || Object.keys(parsed.answers || {}).length > 0;
          if (isRecent && hasProgress) {
            inProgress.add(cat.slug);
          }
        }
      } catch { /* ignore */ }
    }
    setInProgressCategories(inProgress);
  }, []);

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
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
          Choose a <span className="text-amber dark:text-sparky-green">Category</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Test your knowledge across key NEC articles
        </p>
      </motion.div>

      {/* Category List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 overflow-hidden divide-y divide-border dark:divide-stone-800">
          {CATEGORIES.map((category, index) => {
            const Icon = categoryIcons[category.slug];
            const colors = categoryColors[category.slug];
            const questionCount = categoryCounts[category.slug];
            const lastScore = lastScores[category.slug];
            const hasInProgress = inProgressCategories.has(category.slug);

            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.04 }}
              >
                <Link
                  href={`/quiz/${category.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 group transition-colors duration-200 hover:bg-amber/5 dark:hover:bg-sparky-green/5 ${colors.border}`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${colors.icon}`} />
                  </div>

                  {/* Name */}
                  <span className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">
                    {category.name}
                  </span>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {hasInProgress && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-500 dark:text-blue-400">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 dark:bg-blue-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                        </span>
                        In Progress
                      </span>
                    )}
                    {lastScore?.highestPassedDifficulty && lastScore.bestScoreAtHighest !== null && (
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          lastScore.highestPassedDifficulty === "master"
                            ? "bg-red-500/15 text-red-500"
                            : lastScore.highestPassedDifficulty === "journeyman"
                            ? "bg-amber/15 text-amber"
                            : "bg-emerald/15 text-emerald dark:bg-sparky-green/15 dark:text-sparky-green"
                        }`}
                      >
                        <Trophy className="h-3 w-3" />
                        {lastScore.bestScoreAtHighest}%
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {questionCount} Qs
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </Card>
      </motion.div>

      {/* Sparky Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <SparkyMessage
          size="medium"
          message="Pro tip: Start with the areas where you feel least confident! Tackling your weak spots first is the fastest path to mastery. Every electrician has their Achilles' heel - find yours and strengthen it!"
        />
      </motion.div>
      </div>
    </main>
  );
}
