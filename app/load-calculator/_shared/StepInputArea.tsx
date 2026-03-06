"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Lightbulb,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumberWithCommas } from "./utils";

export function StepInputArea({
  formula,
  necReference,
  inputLabel,
  inputMode,
  placeholder,
  allowSlash,
  rawInput,
  userInput,
  onInputChange,
  showHint,
  onToggleHint,
  hintText,
  lastAnswerCorrect,
  onSubmit,
  onTryAgain,
  onPrevious,
  canGoPrevious,
  currentStepIndex,
  totalSteps,
}: {
  formula?: string;
  necReference: string;
  inputLabel: string;
  inputMode: "text" | "numeric";
  placeholder: string;
  allowSlash: boolean;
  rawInput: boolean;
  userInput: string;
  onInputChange: (value: string) => void;
  showHint: boolean;
  onToggleHint: () => void;
  hintText: string;
  lastAnswerCorrect: boolean | null;
  onSubmit: () => void;
  onTryAgain: () => void;
  onPrevious: () => void;
  canGoPrevious: boolean;
  currentStepIndex: number;
  totalSteps: number;
}) {
  return (
    <div className="space-y-4">
      {/* Formula Display */}
      {formula && (
        <div className="bg-purple-soft dark:bg-purple/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-purple dark:text-purple-light" />
            <span className="text-sm font-medium text-purple dark:text-purple-light">Formula</span>
          </div>
          <p className="text-foreground font-mono">{formula}</p>
        </div>
      )}

      {/* Answer Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{inputLabel}</label>
        <div className="flex gap-3">
          <Input
            type="text"
            inputMode={inputMode}
            placeholder={placeholder}
            value={userInput}
            onChange={(e) => {
              if (rawInput) {
                onInputChange(e.target.value);
              } else {
                onInputChange(formatNumberWithCommas(e.target.value));
              }
            }}
            onKeyDown={(e) => {
              const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "Home", "End"];
              if (allowSlash) allowedKeys.push("/");
              if (allowedKeys.includes(e.key) || (e.ctrlKey || e.metaKey)) {
                if (e.key === "Enter" && lastAnswerCorrect !== false) {
                  onSubmit();
                }
                return;
              }
              if (!/^\d$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            disabled={lastAnswerCorrect === false}
            className="text-lg"
          />
          {lastAnswerCorrect === false ? (
            <Button onClick={onTryAgain} className="bg-amber hover:bg-amber/90 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
              Try Again
              <RotateCcw className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onSubmit} className="bg-emerald hover:bg-emerald/90 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
              Submit
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Answer Feedback */}
      <AnimatePresence>
        {lastAnswerCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 p-3 rounded-lg ${
              lastAnswerCorrect
                ? "bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {lastAnswerCorrect ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">
              {lastAnswerCorrect ? "Correct!" : "Not quite - check the explanation above"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint Toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleHint}
          className="border-amber text-amber hover:bg-amber/10 dark:border-sparky-green dark:text-sparky-green dark:hover:bg-sparky-green/10"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          {showHint ? "Hide Hint" : "Show Hint"}
        </Button>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          {necReference}
        </span>
      </div>

      {/* Hint Display */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber/10 border border-amber/30 rounded-lg p-4"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-amber flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber mb-1">Hint</p>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {hintText}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="border-border dark:border-stone-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground self-center">
          Step {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
}
