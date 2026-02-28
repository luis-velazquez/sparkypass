"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Flame, CheckCircle2, ChevronRight, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyChallengeBannerProps {
  completed: boolean;
  studyStreak: number;
  bestStudyStreak: number;
  wattsReward: number;
  wattsEarned: number;
}

export function DailyChallengeBanner({
  completed,
  studyStreak,
  bestStudyStreak,
  wattsReward,
  wattsEarned,
}: DailyChallengeBannerProps) {
  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/daily">
          <div className="relative overflow-hidden rounded-xl border border-emerald/30 dark:border-sparky-green/30 bg-emerald/5 dark:bg-sparky-green/5 p-4 group hover:border-emerald/50 dark:hover:border-sparky-green/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)] transition-all cursor-pointer pressable">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald/20 dark:bg-sparky-green/20 dark:shadow-[0_0_12px_rgba(163,255,0,0.35)] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald dark:text-sparky-green" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Daily Challenge Complete!
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 text-emerald dark:text-sparky-green font-medium">
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      +{wattsEarned}W earned
                    </span>
                    {studyStreak > 0 && (
                      <span className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-medium">
                        <Flame className="h-3.5 w-3.5" />
                        {studyStreak}-day streak
                      </span>
                    )}
                    {bestStudyStreak > 0 && (
                      <span className="flex items-center gap-1 text-amber font-medium">
                        <Trophy className="h-3.5 w-3.5" />
                        Best: {bestStudyStreak}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link href="/daily">
        <div className="relative overflow-hidden rounded-xl border border-purple/30 dark:border-purple/25 bg-gradient-to-r from-purple/10 via-purple/5 to-amber/10 dark:from-purple/10 dark:via-purple/5 dark:to-amber/10 p-5 group hover:border-purple/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)] transition-all cursor-pointer pressable">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple/20 dark:shadow-[0_0_15px_rgba(139,92,246,0.35)] flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Calendar className="h-6 w-6 text-purple dark:text-purple-light" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">
                  Today&apos;s Daily Challenge
                </p>
                <p className="text-sm text-muted-foreground">
                  {studyStreak > 0
                    ? `Keep your ${studyStreak}-day streak alive!`
                    : "Start your daily streak!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              {studyStreak > 0 && (
                <span className="flex items-center gap-1 text-sm text-orange-500 dark:text-orange-400 font-medium">
                  <Flame className="h-4 w-4" />
                  {studyStreak}
                </span>
              )}
              {bestStudyStreak > 0 && (
                <span className="flex items-center gap-1 text-sm text-amber font-medium">
                  <Trophy className="h-3.5 w-3.5" />
                  Best: {bestStudyStreak}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm font-bold text-amber dark:text-sparky-green">
                <Zap className="h-4 w-4 fill-current" />
                +{wattsReward}W
              </span>
              <Button
                size="sm"
                className="bg-purple hover:bg-purple/90 text-white ml-auto md:ml-0"
                tabIndex={-1}
              >
                Start Challenge
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
