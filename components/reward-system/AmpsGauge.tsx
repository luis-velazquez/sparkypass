"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAmpsLabel } from "@/lib/amps";

interface AmpsGaugeProps {
  amps: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getAmpsColor(amps: number): string {
  if (amps >= 70) return "text-red-500 dark:text-red-400";
  if (amps >= 50) return "text-amber dark:text-amber-light";
  if (amps >= 30) return "text-emerald dark:text-sparky-green";
  if (amps >= 10) return "text-sky-500 dark:text-sky-400";
  return "text-stone-400";
}

function getAmpsBarColor(amps: number): string {
  if (amps >= 70) return "from-red-500 to-red-400";
  if (amps >= 50) return "from-amber to-amber-light";
  if (amps >= 30) return "from-emerald to-sparky-green";
  if (amps >= 10) return "from-sky-500 to-sky-400";
  return "from-stone-400 to-stone-300";
}

export function AmpsGauge({ amps, size = "md", showLabel = true, className }: AmpsGaugeProps) {
  const percentage = Math.min((amps / 100) * 100, 100);
  const label = getAmpsLabel(amps);
  const color = getAmpsColor(amps);
  const barColor = getAmpsBarColor(amps);

  const barHeight = { sm: "h-1.5", md: "h-2", lg: "h-3" };
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  const iconSize = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Activity className={cn(iconSize[size], color)} />
            <span className={cn("font-semibold", textSize[size], color)}>
              {amps.toFixed(1)}A
            </span>
          </div>
          <span className={cn("text-muted-foreground", textSize[size])}>
            {label}
          </span>
        </div>
      )}
      <div className={cn("bg-muted dark:bg-stone-800 rounded-full overflow-hidden", barHeight[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full bg-gradient-to-r rounded-full", barColor)}
        />
      </div>
    </div>
  );
}
