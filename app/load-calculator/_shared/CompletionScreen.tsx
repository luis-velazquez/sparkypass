"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompletionResults } from "./types";

export function CompletionScreen({
  results,
  buildingDescription,
  onReset,
}: {
  results: CompletionResults;
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

      {/* Results Grid */}
      <div className={`grid ${results.aluminumConductorSize ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"} gap-4 mb-6 max-w-lg mx-auto`}>
        <div className="bg-amber/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Service</p>
          <p className="text-xl font-bold text-amber dark:text-sparky-green">{results.serviceAmps}A</p>
        </div>
        <div className="bg-emerald/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Conductor (Cu)</p>
          <p className="text-xl font-bold text-emerald dark:text-sparky-green">{results.conductorSize}</p>
          <p className="text-xs text-muted-foreground">AWG/kcmil</p>
        </div>
        {results.aluminumConductorSize && (
          <div className="bg-sky-500/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Conductor (Al)</p>
            <p className="text-xl font-bold text-sky-500 dark:text-sky-400">{results.aluminumConductorSize}</p>
            <p className="text-xs text-muted-foreground">AWG/kcmil</p>
          </div>
        )}
        <div className="bg-purple/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">GEC</p>
          <p className="text-xl font-bold text-purple dark:text-purple-light">{results.gecSize}</p>
          <p className="text-xs text-muted-foreground">AWG</p>
        </div>
      </div>

      <p className="text-muted-foreground mb-6">
        You calculated a <span className="text-amber dark:text-sparky-green font-semibold">{results.serviceAmps}A</span> service
        with <span className="text-emerald dark:text-sparky-green font-semibold">{results.conductorSize}</span> Cu{results.aluminumConductorSize ? <> / <span className="text-sky-500 dark:text-sky-400 font-semibold">{results.aluminumConductorSize}</span> Al</> : null} conductors
        and <span className="text-purple dark:text-purple-light font-semibold">{results.gecSize} AWG</span> GEC
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
