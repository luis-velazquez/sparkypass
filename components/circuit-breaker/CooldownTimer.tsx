"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer } from "lucide-react";
import { formatCooldown } from "@/lib/circuit-breaker";

interface CooldownTimerProps {
  cooldownEndsAt: Date;
  onExpired: () => void;
}

export function CooldownTimer({ cooldownEndsAt, onExpired }: CooldownTimerProps) {
  const [remaining, setRemaining] = useState(() => {
    const diff = cooldownEndsAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = cooldownEndsAt.getTime() - Date.now();
      const secs = Math.max(0, Math.ceil(diff / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEndsAt, onExpired]);

  const progress = remaining > 0 ? (remaining / (30 * 60)) * 100 : 0;

  return (
    <div className="text-center">
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/30 mb-4"
      >
        <Timer className="h-5 w-5 text-red-500" />
        <span className="text-2xl font-mono font-bold text-red-500">
          {formatCooldown(remaining)}
        </span>
      </motion.div>

      {/* Progress bar */}
      <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden max-w-xs mx-auto">
        <motion.div
          initial={{ width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-red-500/50 rounded-full"
        />
      </div>

      <p className="text-sm text-muted-foreground mt-3">
        Cooldown active — wait it out or spend Watts to reset
      </p>
    </div>
  );
}
