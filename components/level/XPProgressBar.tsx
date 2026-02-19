"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelTitle, getXPProgress } from "@/lib/levels";

interface XPProgressBarProps {
  xp: number;
  level: number;
  /** Show the level label above the bar */
  showLevel?: boolean;
  /** Show XP numbers below the bar */
  showXPNumbers?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
  /** Animation duration in seconds */
  animationDuration?: number;
}

export function XPProgressBar({
  xp,
  level,
  showLevel = true,
  showXPNumbers = true,
  size = "md",
  className,
  animationDuration = 0.8,
}: XPProgressBarProps) {
  const xpProgress = getXPProgress(xp, level);
  const levelTitle = getLevelTitle(level);
  const isMaxLevel = level >= 10;

  const barHeight = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLevel && (
        <div className="flex items-center gap-2 mb-2">
          <Star className={cn(iconSize[size], "text-amber dark:text-sparky-green")} />
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-bold text-foreground",
                size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl"
              )}
            >
              Level {level}
            </span>
            <span className={cn("text-muted-foreground", textSize[size])}>
              {levelTitle}
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className={cn("bg-muted dark:bg-stone-800 rounded-full overflow-hidden", barHeight[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${xpProgress.percentage}%` }}
          transition={{ duration: animationDuration, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark rounded-full"
        />
      </div>

      {/* XP Numbers */}
      {showXPNumbers && (
        <div
          className={cn(
            "flex justify-between mt-1.5 text-muted-foreground",
            textSize[size]
          )}
        >
          <span>{xp.toLocaleString()} XP</span>
          {isMaxLevel ? (
            <span className="text-amber dark:text-sparky-green font-medium">Max Level!</span>
          ) : (
            <span>
              {xpProgress.current.toLocaleString()} / {xpProgress.needed.toLocaleString()} to Level {level + 1}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
