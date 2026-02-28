"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoltageTier } from "@/types/reward-system";

const TIER_COLORS: Record<VoltageTier, { text: string; bg: string; glow: string }> = {
  1: { text: "text-stone-400", bg: "bg-stone-400/10", glow: "" },
  2: { text: "text-amber", bg: "bg-amber/10", glow: "" },
  3: { text: "text-amber dark:text-sparky-green", bg: "bg-amber/10 dark:bg-sparky-green/10", glow: "drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" },
  4: { text: "text-amber dark:text-sparky-green", bg: "bg-amber/15 dark:bg-sparky-green/15", glow: "drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" },
  5: { text: "text-purple dark:text-purple-light", bg: "bg-purple/10", glow: "drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" },
  6: { text: "text-purple dark:text-purple-light", bg: "bg-purple/15", glow: "drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" },
  7: { text: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", glow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" },
};

interface VoltageDisplayProps {
  tier: VoltageTier;
  voltage: string;
  title: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VoltageDisplay({ tier, voltage, title, size = "md", className }: VoltageDisplayProps) {
  const colors = TIER_COLORS[tier];

  const iconSize = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
  const voltageSize = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };
  const titleSize = { sm: "text-xs", md: "text-xs", lg: "text-sm" };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={cn("p-1.5 rounded-lg", colors.bg)}
      >
        <Zap className={cn(iconSize[size], colors.text, colors.glow)} />
      </motion.div>
      <div>
        <div className={cn("font-bold leading-tight", voltageSize[size], colors.text)}>
          {voltage}
        </div>
        <div className={cn("text-muted-foreground leading-tight", titleSize[size])}>
          {title}
        </div>
      </div>
    </div>
  );
}
