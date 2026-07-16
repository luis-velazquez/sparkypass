"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserClassification } from "@/types/reward-system";

// Ten-step escalation: quiet stone → warm amber → power purple → storm red →
// solar gold. Glow radius grows with rank.
const CLASSIFICATION_COLORS: Record<UserClassification, { text: string; bg: string; glow: string }> = {
  milliwatt_electrician: { text: "text-stone-400", bg: "bg-stone-400/10", glow: "" },
  watt_electrician: { text: "text-stone-500 dark:text-stone-300", bg: "bg-stone-400/10", glow: "" },
  kilowatt_electrician: { text: "text-amber dark:text-sparky-green", bg: "bg-amber/10 dark:bg-sparky-green/10", glow: "drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" },
  megawatt_electrician: { text: "text-amber-dark dark:text-amber", bg: "bg-amber/10", glow: "drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" },
  gigawatt_electrician: { text: "text-purple dark:text-purple-light", bg: "bg-purple/10", glow: "drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" },
  terawatt_electrician: { text: "text-purple-dark dark:text-purple", bg: "bg-purple/10", glow: "drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" },
  petawatt_electrician: { text: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", glow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" },
  exawatt_electrician: { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", glow: "drop-shadow-[0_0_14px_rgba(239,68,68,0.6)]" },
  zettawatt_electrician: { text: "text-amber-light dark:text-amber-light", bg: "bg-amber-light/10", glow: "drop-shadow-[0_0_16px_rgba(252,211,77,0.6)]" },
  yottawatt_electrician: { text: "text-amber-light dark:text-white", bg: "bg-amber-light/10", glow: "drop-shadow-[0_0_18px_rgba(252,211,77,0.7)]" },
};

interface VoltageDisplayProps {
  classification: UserClassification;
  title: string;
  wattsBalance: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VoltageDisplay({ classification, title, wattsBalance, size = "md", className }: VoltageDisplayProps) {
  const colors = CLASSIFICATION_COLORS[classification];

  const iconSize = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
  const wattsSize = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };
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
        <div className={cn("font-bold leading-tight", wattsSize[size], colors.text)}>
          {wattsBalance.toLocaleString()}W
        </div>
        <div className={cn("text-muted-foreground leading-tight", titleSize[size])}>
          {title}
        </div>
      </div>
    </div>
  );
}
