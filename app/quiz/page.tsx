"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Zap, Shield, ChevronRight, Navigation, Table, Box, CircleDot, TrendingDown, Cog, Thermometer, Omega, GitBranch, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import { getCategoryCounts } from "@/lib/questions";

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
  "load-calculations": BookOpen,
  "grounding-bonding": Shield,
  services: Zap,
  "textbook-navigation": Navigation,
  "chapter-9-tables": Table,
  "box-fill": Box,
  "conduit-fill": CircleDot,
  "voltage-drop": TrendingDown,
  "motor-calculations": Cog,
  "temperature-correction": Thermometer,
  "resistance": Omega,
  "transformer-sizing": GitBranch,
};

// Map category slugs to colors
const categoryColors = {
  "load-calculations": {
    icon: "text-purple dark:text-purple-light",
    bg: "bg-purple-soft dark:bg-purple/10 dark:shadow-[0_0_15px_rgba(139,92,246,0.35)]",
    border: "hover:border-purple/50",
  },
  "grounding-bonding": {
    icon: "text-emerald dark:text-sparky-green",
    bg: "bg-emerald/10 dark:bg-sparky-green/10 dark:shadow-[0_0_15px_rgba(163,255,0,0.35)]",
    border: "hover:border-emerald/50 dark:hover:border-sparky-green/50",
  },
  services: {
    icon: "text-amber dark:text-amber-light",
    bg: "bg-amber/10 dark:shadow-[0_0_15px_rgba(245,158,11,0.35)]",
    border: "hover:border-amber/50",
  },
  "textbook-navigation": {
    icon: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:shadow-[0_0_15px_rgba(59,130,246,0.35)]",
    border: "hover:border-blue-500/50",
  },
  "chapter-9-tables": {
    icon: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10 dark:shadow-[0_0_15px_rgba(249,115,22,0.35)]",
    border: "hover:border-orange-500/50",
  },
  "box-fill": {
    icon: "text-cyan-500 dark:text-cyan-400",
    bg: "bg-cyan-500/10 dark:shadow-[0_0_15px_rgba(6,182,212,0.35)]",
    border: "hover:border-cyan-500/50",
  },
  "conduit-fill": {
    icon: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:shadow-[0_0_15px_rgba(244,63,94,0.35)]",
    border: "hover:border-rose-500/50",
  },
  "voltage-drop": {
    icon: "text-yellow-500 dark:text-yellow-400",
    bg: "bg-yellow-500/10 dark:shadow-[0_0_15px_rgba(234,179,8,0.35)]",
    border: "hover:border-yellow-500/50",
  },
  "motor-calculations": {
    icon: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-500/10 dark:shadow-[0_0_15px_rgba(99,102,241,0.35)]",
    border: "hover:border-indigo-500/50",
  },
  "temperature-correction": {
    icon: "text-red-400 dark:text-red-300",
    bg: "bg-red-400/10 dark:shadow-[0_0_15px_rgba(248,113,113,0.35)]",
    border: "hover:border-red-400/50",
  },
  "resistance": {
    icon: "text-teal-500 dark:text-teal-400",
    bg: "bg-teal-500/10 dark:shadow-[0_0_15px_rgba(20,184,166,0.35)]",
    border: "hover:border-teal-500/50",
  },
  "transformer-sizing": {
    icon: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-500/10 dark:shadow-[0_0_15px_rgba(14,165,233,0.35)]",
    border: "hover:border-sky-500/50",
  },
};

const QUIZ_STORAGE_PREFIX = "sparkypass-quiz-progress-";

export default function QuizPage() {
  const categoryCounts = getCategoryCounts();
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
      <div className="container mx-auto px-4 py-8 relative z-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
          Choose a <span className="text-amber dark:text-sparky-green">Category</span>
        </h1>
        <p className="text-muted-foreground">
          Test your knowledge across key NEC articles. Each quiz pulls from our
          question bank to keep you sharp!
        </p>
      </motion.div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {CATEGORIES.map((category, index) => {
          const Icon = categoryIcons[category.slug];
          const colors = categoryColors[category.slug];
          const questionCount = categoryCounts[category.slug];
          const lastScore = lastScores[category.slug];
          const hasInProgress = inProgressCategories.has(category.slug);

          return (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Link href={`/quiz/${category.slug}`}>
                <Card
                  className={`h-full hover:shadow-lg transition-all duration-300 cursor-pointer group pressable border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/30 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)] ${colors.border}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300`}
                      >
                        <Icon className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        {lastScore?.highestPassedDifficulty && lastScore.bestScoreAtHighest !== null && (
                          <span
                            className={`text-sm font-bold px-2 py-0.5 rounded flex items-center gap-1.5 ${
                              lastScore.highestPassedDifficulty === "master"
                                ? "bg-red-500/15 text-red-500"
                                : lastScore.highestPassedDifficulty === "journeyman"
                                ? "bg-amber/15 text-amber"
                                : "bg-emerald/15 text-emerald dark:bg-sparky-green/15 dark:text-sparky-green"
                            }`}
                          >
                            <Trophy className="h-3.5 w-3.5" />
                            {lastScore.highestPassedDifficulty.charAt(0).toUpperCase() + lastScore.highestPassedDifficulty.slice(1)} · {lastScore.bestScoreAtHighest}%
                          </span>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-border dark:border-stone-700">
                        <div className="flex items-center gap-2">
                          {hasInProgress && (
                            <span className="flex items-center gap-1.5 text-sm font-medium text-blue-500 dark:text-blue-400">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 dark:bg-blue-400 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                              </span>
                              In Progress
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {questionCount} questions
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Sparky Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
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
