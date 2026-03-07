"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommercialCompletionScreen({
  serviceAmps,
  buildingDescription,
  onReset,
}: {
  serviceAmps: number;
  buildingDescription: string;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className="w-20 h-20 rounded-full bg-emerald/10 dark:bg-sparky-green/10 dark:shadow-[0_0_15px_rgba(163,255,0,0.35)] flex items-center justify-center mx-auto mb-4 transition-all duration-300">
        <Trophy className="h-10 w-10 text-emerald dark:text-sparky-green" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Calculation Complete!
      </h2>

      <div className="max-w-xs mx-auto mb-6">
        <div className="bg-amber/10 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Service Amps</p>
          <p className="text-3xl font-bold text-amber dark:text-sparky-green">{serviceAmps}A</p>
        </div>
      </div>

      <p className="text-muted-foreground mb-6">
        You calculated a <span className="text-amber dark:text-sparky-green font-semibold">{serviceAmps}A</span> service
        for this {buildingDescription}.
      </p>
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onReset} className="border-border dark:border-stone-700">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Another
        </Button>
      </div>
    </motion.div>
  );
}
