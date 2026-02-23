"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SparkyAvatar } from "@/components/sparky";

interface WelcomeOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function WelcomeOnboarding({ isOpen, onComplete, onSkip }: WelcomeOnboardingProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-0 overflow-hidden border-border dark:border-stone-800 bg-card dark:bg-stone-900"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Welcome to SparkyPass</DialogTitle>

        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber via-amber-light to-amber dark:from-sparky-green dark:via-sparky-green-dark dark:to-sparky-green" />

        <div className="px-6 pt-6 pb-5">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <SparkyAvatar size="large" className="mb-4" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-xl font-bold font-display text-foreground mb-2"
            >
              Welcome to SparkyPass!
            </motion.h2>

            {/* Message */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm"
            >
              Hey there! I&apos;m Sparky, your study buddy. I&apos;ll help you pass your electrician exam with quizzes, flashcards, and interactive tools!
            </motion.p>

            {/* Button */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="w-full"
            >
              <Button
                onClick={onComplete}
                className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
              >
                <Zap className="h-4 w-4 mr-2" />
                Let&apos;s Go!
              </Button>
              <button
                onClick={onSkip}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip introduction
              </button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
