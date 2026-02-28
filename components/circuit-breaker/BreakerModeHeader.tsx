"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Zap, Flame } from "lucide-react";

interface BreakerModeHeaderProps {
  categoryName: string;
  consecutiveWrong: number;
  currentStreak: number;
  bestStreak: number;
  totalTrips: number;
}

export function BreakerModeHeader({
  categoryName,
  consecutiveWrong,
  currentStreak,
  bestStreak,
  totalTrips,
}: BreakerModeHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{categoryName}</h2>
          <p className="text-xs text-muted-foreground">Circuit Breaker Mode</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Warning indicators */}
        <div className="flex gap-1.5">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              animate={
                i < consecutiveWrong
                  ? { scale: [1, 1.2, 1], opacity: 1 }
                  : { scale: 1, opacity: 0.3 }
              }
              transition={
                i < consecutiveWrong
                  ? { duration: 0.5, repeat: Infinity, repeatDelay: 1 }
                  : {}
              }
              className={`w-3 h-3 rounded-full ${
                i < consecutiveWrong
                  ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                  : "bg-muted dark:bg-stone-700"
              }`}
            />
          ))}
        </div>

        {/* Streak badge */}
        {currentStreak > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green text-sm font-bold"
          >
            <Flame className="h-3.5 w-3.5" />
            {currentStreak}
          </motion.span>
        )}

        {/* Stats */}
        <span className="text-xs text-muted-foreground">
          Best: {bestStreak} | Trips: {totalTrips}
        </span>
      </div>
    </div>
  );
}
