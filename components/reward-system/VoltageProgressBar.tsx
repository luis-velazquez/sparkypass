"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClassificationConfig } from "@/lib/voltage";

interface VoltageProgressBarProps {
  classificationTitle: string;
  wattsBalance: number;
  percentage: number;
  next: ClassificationConfig | null;
  showClassification?: boolean;
  showWatts?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  animationDuration?: number;
}

export function VoltageProgressBar({
  classificationTitle,
  wattsBalance,
  percentage,
  next,
  showClassification = true,
  showWatts = true,
  size = "md",
  className,
  animationDuration = 0.8,
}: VoltageProgressBarProps) {
  const isMax = !next;

  const barHeight = { sm: "h-2", md: "h-3", lg: "h-4" };
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  const iconSize = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };

  return (
    <div className={cn("w-full", className)}>
      {showClassification && (
        <div className="flex items-center gap-2 mb-2">
          <Zap className={cn(iconSize[size], "text-amber dark:text-sparky-green fill-current")} />
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-bold text-foreground",
                size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl"
              )}
            >
              {wattsBalance.toLocaleString()}W
            </span>
            <span className={cn("text-muted-foreground", textSize[size])}>
              {classificationTitle}
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className={cn("bg-muted dark:bg-stone-800 rounded-full overflow-hidden", barHeight[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animationDuration, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark rounded-full"
        />
      </div>

      {/* Stats */}
      {showWatts && (
        <div
          className={cn(
            "flex justify-between mt-1.5 text-muted-foreground",
            textSize[size]
          )}
        >
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber dark:text-sparky-green fill-current" />
            {wattsBalance.toLocaleString()}W balance
          </span>
          {isMax ? (
            <span className="text-amber dark:text-sparky-green font-medium">Max Classification!</span>
          ) : (
            <span>
              {percentage}% to {next.title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
