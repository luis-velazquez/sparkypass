"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SparkyAvatar } from "@/components/sparky";
import { Zap, Trophy, ShieldCheck } from "lucide-react";
import type { VoltageTier } from "@/types/reward-system";

// Sparky celebration messages for voltage tier advancement
const VOLTAGE_UP_MESSAGES = [
  "Your voltage just jumped! You're conducting at a whole new level now!",
  "Tier up! The current is flowing stronger through your circuits!",
  "Power surge detected! You've proven your mastery to advance!",
  "Incredible! You've energized a new voltage tier!",
  "The grid is buzzing! Your dedication has paid off big time!",
  "New voltage unlocked! You're becoming a true power conductor!",
  "Transformer alert! Your electrical knowledge is electrifying!",
  "Voltage upgrade complete! Keep that current flowing!",
];

export function getRandomVoltageUpMessage(): string {
  return VOLTAGE_UP_MESSAGES[Math.floor(Math.random() * VOLTAGE_UP_MESSAGES.length)];
}

interface VoltageUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTier: VoltageTier;
  newTitle: string;
  newVoltage: string;
  message: string;
}

export function VoltageUpModal({
  isOpen,
  onClose,
  newTier,
  newTitle,
  newVoltage,
  message,
}: VoltageUpModalProps) {
  const hasPlayedConfetti = useRef(false);

  useEffect(() => {
    if (isOpen && !hasPlayedConfetti.current) {
      hasPlayedConfetti.current = true;

      const timer = setTimeout(() => {
        haptic("celebration");
        const colors = ["#F59E0B", "#A3FF00", "#8B5CF6", "#FFFBEB", "#10B981"];

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { x: 0.2, y: 0.6 },
          colors,
        });

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { x: 0.8, y: 0.6 },
          colors,
        });

        setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 120,
            origin: { x: 0.5, y: 0.5 },
            colors,
          });
        }, 250);
      }, 300);

      return () => clearTimeout(timer);
    }

    if (!isOpen) {
      hasPlayedConfetti.current = false;
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-amber/30 dark:border-sparky-green/30 overflow-hidden">
        <DialogTitle className="sr-only">Voltage Tier Up!</DialogTitle>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center text-center py-4 relative"
            >
              {/* Lightning bolt animations */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      rotate: [0, 180],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    className="absolute text-amber dark:text-sparky-green"
                    style={{
                      left: `${20 + (i * 12)}%`,
                      top: `${15 + (i % 3) * 25}%`,
                    }}
                  >
                    <Zap className="h-4 w-4 fill-current" />
                  </motion.div>
                ))}
              </div>

              {/* Tier Up Badge */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="mb-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber to-amber-dark dark:from-sparky-green dark:to-sparky-green-dark text-white dark:text-stone-950 font-bold text-lg">
                  <ShieldCheck className="h-5 w-5" />
                  VOLTAGE UP!
                  <Zap className="h-5 w-5" />
                </div>
              </motion.div>

              {/* Voltage Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="mb-2"
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber via-amber-light to-amber dark:from-sparky-green dark:via-sparky-green dark:to-sparky-green-dark flex items-center justify-center shadow-glow-primary dark:shadow-glow-sparky">
                  <div className="w-24 h-24 rounded-full bg-background flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-amber dark:text-sparky-green">
                      {newVoltage}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      Tier {newTier}
                    </span>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <div className="px-3 py-1 rounded-full bg-purple-soft dark:bg-purple/20 text-purple dark:text-purple-light text-sm font-semibold whitespace-nowrap">
                  {newTitle}
                </div>
              </motion.div>

              {/* Sparky Celebration */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-start gap-3 mb-6 p-4 bg-purple-soft/50 dark:bg-purple/10 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <SparkyAvatar size="small" />
                </div>
                <div className="relative bg-background rounded-lg p-3 shadow-sm">
                  <div className="absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-background border-b-8 border-b-transparent" />
                  <p className="text-sm text-foreground">{message}</p>
                </div>
              </motion.div>

              {/* Continue Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <Button
                  onClick={onClose}
                  className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 font-semibold px-8"
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
