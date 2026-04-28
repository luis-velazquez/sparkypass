"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Zap, Shield, ChevronRight, Box, Cog, GitBranch, HardHat, Cable, Shuffle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import { getQuestionsByCategoryAndDifficulty, getQuestionsByDifficulty } from "@/lib/questions";
import { useNecVersion } from "@/lib/nec-version";

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

const categoryColors: Record<string, { icon: string; bg: string; border: string }> = {
  "calculations-and-theory": { icon: "text-purple dark:text-purple-light", bg: "bg-purple-soft dark:bg-purple/10", border: "hover:border-purple/50" },
  "grounding-bonding": { icon: "text-emerald dark:text-sparky-green", bg: "bg-emerald/10 dark:bg-sparky-green/10", border: "hover:border-emerald/50 dark:hover:border-sparky-green/50" },
  services: { icon: "text-amber dark:text-amber-light", bg: "bg-amber/10", border: "hover:border-amber/50" },
  "box-fill": { icon: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-500/10", border: "hover:border-cyan-500/50" },
  "motors-and-generators": { icon: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "hover:border-indigo-500/50" },
  "transformer-sizing": { icon: "text-sky-500 dark:text-sky-400", bg: "bg-sky-500/10", border: "hover:border-sky-500/50" },
  "special-occupancies": { icon: "text-fuchsia-500 dark:text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "hover:border-fuchsia-500/50" },
  "wiring-methods": { icon: "text-lime-600 dark:text-lime-400", bg: "bg-lime-600/10", border: "hover:border-lime-600/50" },
};

export default function ApprenticeQuizPage() {
  const { necVersion } = useNecVersion();
  const totalApprentice = getQuestionsByDifficulty("apprentice", necVersion).length;

  // Get apprentice question counts per category
  const categoryCounts: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    categoryCounts[cat.slug] = getQuestionsByCategoryAndDifficulty(cat.slug, "apprentice", necVersion).length;
  }

  // Only show categories that have apprentice questions
  const availableCategories = CATEGORIES.filter((cat) => categoryCounts[cat.slug] > 0);

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-amber dark:text-sparky-green" />
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              <span className="text-amber dark:text-sparky-green">Apprentice</span> Quiz
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Apprentice-level questions only. Build your foundation before moving up.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-6"
        >
          <SparkyMessage size="medium" message="Start here! These questions cover the fundamentals every apprentice needs to know before stepping onto the job site." />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          {/* All Categories — standalone */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-3"
          >
            <Link
              href="/apprentice/quiz/all"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber/30 dark:border-sparky-green/20 bg-amber/5 dark:bg-sparky-green/5 hover:bg-amber/10 dark:hover:bg-sparky-green/10 group transition-colors duration-200"
            >
              <div className="w-9 h-9 rounded-lg bg-amber/15 dark:bg-sparky-green/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Shuffle className="h-4.5 w-4.5 text-amber dark:text-sparky-green" />
              </div>
              <span className="font-bold text-sm text-amber dark:text-sparky-green flex-1 min-w-0 truncate">
                All Categories
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {totalApprentice} questions
                </span>
                <ChevronRight className="h-4 w-4 text-amber dark:text-sparky-green group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>

          <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 overflow-hidden divide-y divide-border dark:divide-stone-800">
            {availableCategories.map((category, index) => {
              const Icon = categoryIcons[category.slug];
              const colors = categoryColors[category.slug];
              const questionCount = categoryCounts[category.slug];

              return (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + index * 0.04 }}
                >
                  <Link
                    href={`/apprentice/quiz/${category.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 group transition-colors duration-200 hover:bg-amber/5 dark:hover:bg-sparky-green/5 ${colors.border}`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-4.5 w-4.5 ${colors.icon}`} />
                    </div>
                    <span className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">
                      {category.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {questionCount} questions
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
