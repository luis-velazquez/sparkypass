"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserClassification } from "@/types/reward-system";
import { getClassificationByKey } from "@/lib/voltage";

interface VoltageDisplayProps {
  classification: UserClassification;
  title: string;
  wattsBalance: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VoltageDisplay({ classification, title, wattsBalance, size = "md", className }: VoltageDisplayProps) {
  const colors = getClassificationByKey(classification).colors;

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
