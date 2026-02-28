"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RESET_COST } from "@/lib/circuit-breaker";

interface ResetButtonProps {
  categorySlug: string;
  wattsBalance: number;
  onReset: () => void;
}

export function ResetButton({ categorySlug, wattsBalance, onReset }: ResetButtonProps) {
  const [resetting, setResetting] = useState(false);
  const canAfford = wattsBalance >= RESET_COST;

  async function handleReset() {
    if (!canAfford || resetting) return;

    setResetting(true);
    try {
      const res = await fetch("/api/circuit-breaker/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorySlug }),
      });

      if (res.ok) {
        window.dispatchEvent(new Event("watts-updated"));
        onReset();
      }
    } catch (error) {
      console.error("Failed to reset breaker:", error);
    } finally {
      setResetting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Button
        onClick={handleReset}
        disabled={!canAfford || resetting}
        size="lg"
        className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-2"
      >
        {resetting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
        Reset Breaker
        <span className="inline-flex items-center gap-1 ml-1 opacity-80">
          <Zap className="h-3.5 w-3.5" />
          {RESET_COST}W
        </span>
      </Button>

      {!canAfford && (
        <p className="text-xs text-red-500 mt-2 text-center">
          Need {RESET_COST}W — you have {wattsBalance}W
        </p>
      )}
    </motion.div>
  );
}
