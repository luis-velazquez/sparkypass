"use client";

import { motion } from "framer-motion";
import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CalculatorPageLayout({
  isLoading,
  subtitle,
  hasScenario,
  currentStepIndex,
  totalSteps,
  isComplete,
  onReset,
  children,
}: {
  isLoading: boolean;
  subtitle: string;
  hasScenario: boolean;
  currentStepIndex: number;
  totalSteps: number;
  isComplete: boolean;
  onReset: () => void;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  const progress = hasScenario
    ? ((currentStepIndex + (isComplete ? 1 : 0)) / totalSteps) * 100
    : 0;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <button
                type="button"
                onClick={onReset}
                className="text-left"
              >
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <span className="text-amber dark:text-sparky-green">Load Calculator</span>
                </h1>
              </button>
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            </div>
            {hasScenario && (
              <Button variant="outline" onClick={onReset} className="border-border dark:border-stone-700">
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
        </motion.div>

        {/* Progress Bar */}
        {hasScenario && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative z-10 mb-6"
          >
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-amber dark:bg-sparky-green rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Main Content - 3 Column Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {children}
        </div>
      </div>
    </main>
  );
}
