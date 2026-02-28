"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface WattsCounterProps {
  watts: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

export function WattsCounter({ watts, size = "md", showIcon = true, animate = true, className }: WattsCounterProps) {
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-lg" };
  const iconSize = { sm: "h-3 w-3", md: "h-3.5 w-3.5", lg: "h-5 w-5" };

  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold text-amber dark:text-sparky-green", textSize[size], className)}>
      {showIcon && <Zap className={cn(iconSize[size], "fill-current")} />}
      {animate ? (
        <AnimatePresence mode="popLayout">
          <motion.span
            key={watts}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {watts.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      ) : (
        <span>{watts.toLocaleString()}</span>
      )}
      <span className="text-muted-foreground font-normal">W</span>
    </span>
  );
}
