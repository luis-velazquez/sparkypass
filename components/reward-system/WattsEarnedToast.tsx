"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface WattsEarnedToastProps {
  watts: number;
  show: boolean;
}

export function WattsEarnedToast({ watts, show }: WattsEarnedToastProps) {
  return (
    <AnimatePresence>
      {show && watts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber/10 dark:bg-sparky-green/10 border border-amber/20 dark:border-sparky-green/20"
        >
          <Zap className="h-4 w-4 text-amber dark:text-sparky-green fill-current" />
          <span className="text-sm font-bold text-amber dark:text-sparky-green">
            +{watts}W
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
