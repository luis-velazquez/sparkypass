"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PowerFormulaProps {
  voltage: number;
  amps: number;
  watts: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PowerFormula({ voltage, amps, watts, size = "md", className }: PowerFormulaProps) {
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-lg" };
  const numberSize = { sm: "text-sm", md: "text-base", lg: "text-xl" };

  return (
    <div className={cn("flex items-center gap-2 font-mono", className)}>
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn("font-bold text-amber dark:text-sparky-green", numberSize[size])}
      >
        {watts.toLocaleString()}W
      </motion.span>
      <span className={cn("text-muted-foreground", textSize[size])}>=</span>
      <span className={cn("text-purple dark:text-purple-light font-semibold", textSize[size])}>
        {voltage}V
      </span>
      <span className={cn("text-muted-foreground", textSize[size])}>×</span>
      <span className={cn("text-sky-500 dark:text-sky-400 font-semibold", textSize[size])}>
        {amps}A
      </span>
    </div>
  );
}
