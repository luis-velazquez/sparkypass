"use client";

import { motion } from "framer-motion";
import { Save, Zap, Calculator, ChevronRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SavedProgress } from "./types";

export function ResumePromptModal({
  savedProgress,
  scenarioName,
  scenarioIcon,
  totalSteps,
  onContinue,
  onStartFresh,
}: {
  savedProgress: SavedProgress;
  scenarioName: string;
  scenarioIcon: React.ReactNode;
  totalSteps: number;
  onContinue: () => void;
  onStartFresh: () => void;
}) {
  const progressPercent = Math.round(
    ((savedProgress.currentStepIndex + (savedProgress.isComplete ? 1 : 0)) / totalSteps) * 100
  );

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber/10 dark:shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center justify-center mx-auto mb-4 transition-all duration-300">
                <Save className="h-8 w-8 text-amber dark:text-amber-light" />
              </div>
              <CardTitle className="text-xl">Welcome Back!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  You have saved progress from a previous session.
                </p>

                <div className="bg-muted dark:bg-stone-800 rounded-lg p-4 text-left space-y-2">
                  <div className="flex items-center gap-2">
                    {scenarioIcon}
                    <span className="font-medium">{scenarioName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" />
                    <span>
                      {savedProgress.difficulty === "beginner" ? "Beginner" : "Intermediate"} Mode
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calculator className="h-3.5 w-3.5" />
                    <span>
                      {savedProgress.isComplete
                        ? "Completed"
                        : `Step ${savedProgress.currentStepIndex + 1} of ${totalSteps}`}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="pt-2">
                    <div className="h-2 bg-background dark:bg-stone-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber dark:bg-sparky-green rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {progressPercent}% complete
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={onContinue}
                  className="bg-amber hover:bg-amber/90 w-full dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Continue Where I Left Off
                </Button>
                <Button
                  variant="outline"
                  onClick={onStartFresh}
                  className="w-full border-border dark:border-stone-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start a New Calculation
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
