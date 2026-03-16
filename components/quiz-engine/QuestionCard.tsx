"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, Book } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getNecReference } from "@/lib/nec-version";
import type { Question, NecVersion } from "@/types/question";

export interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  isSubmitted: boolean;
  onSelectAnswer: (index: number) => void;
  necVersion: NecVersion;
  answerButtonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;

  /** Whether the hint toggle is visible (default: true) */
  hintsVisible?: boolean;
  /** Whether the NEC reference is shown inside the hint (default: true) */
  showNecReference?: boolean;
  /** Whether the hint panel is currently open */
  showHint: boolean;
  /** Toggle hint open/closed */
  onToggleHint: () => void;
}

export function QuestionCard({
  question,
  selectedAnswer,
  isSubmitted,
  onSelectAnswer,
  necVersion,
  answerButtonRefs,
  hintsVisible = true,
  showNecReference = true,
  showHint,
  onToggleHint,
}: QuestionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardContent className="pt-6">
            {/* Hint Button */}
            {hintsVisible && (
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={onToggleHint}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                    showHint
                      ? "bg-amber text-white border-amber dark:bg-sparky-green dark:text-stone-950 dark:border-sparky-green"
                      : "bg-amber/10 text-amber border-amber/30 hover:bg-amber/20 dark:bg-sparky-green/10 dark:text-sparky-green dark:border-sparky-green/30 dark:hover:bg-sparky-green/20"
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Hint
                  <motion.div
                    animate={{ rotate: showHint ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </motion.div>
                </button>
              </div>
            )}

            {/* Question Text */}
            <h2 className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
              {question.questionText}
            </h2>

            {/* Expandable Hint Section */}
            <AnimatePresence>
              {hintsVisible && showHint && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 p-4 rounded-xl backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-xl">
                    {showNecReference && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-purple/20">
                          <Book className="h-4 w-4 text-purple" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">NEC Reference</p>
                          <p className="text-sm font-semibold text-purple">
                            {getNecReference(question, necVersion)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Answer Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrect = isSubmitted && isCorrect;
            const showIncorrect = isSubmitted && isSelected && !isCorrect;

            let optionClasses =
              "w-full p-4 text-left rounded-lg border-2 transition-all min-h-[56px] ";

            if (showCorrect) {
              optionClasses +=
                "border-emerald bg-emerald/10 dark:border-sparky-green dark:bg-sparky-green/10 text-foreground";
            } else if (showIncorrect) {
              optionClasses +=
                "border-red-500 bg-red-500/10 text-foreground";
            } else if (isSelected) {
              optionClasses +=
                "border-amber bg-amber/10 dark:border-sparky-green dark:bg-sparky-green/10 text-foreground";
            } else if (isSubmitted) {
              optionClasses += "border-border bg-muted/50 dark:bg-stone-800/50 text-muted-foreground";
            } else {
              optionClasses +=
                "border-border hover:border-amber/50 dark:hover:border-sparky-green/50 hover:bg-muted/50 dark:hover:bg-stone-800/50 cursor-pointer";
            }

            return (
              <motion.button
                key={index}
                ref={(el) => { answerButtonRefs.current[index] = el; }}
                onClick={() => onSelectAnswer(index)}
                disabled={isSubmitted}
                whileTap={!isSubmitted ? { scale: 0.97 } : undefined}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={optionClasses}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      showCorrect
                        ? "bg-emerald text-white dark:bg-sparky-green dark:text-stone-950"
                        : showIncorrect
                        ? "bg-red-500 text-white"
                        : isSelected
                        ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950"
                        : "bg-muted dark:bg-stone-800 text-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="pt-1">{option}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
