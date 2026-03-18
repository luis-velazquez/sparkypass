"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  BookOpen,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import type { Question, NecVersion } from "@/types/question";

// ─── Blueprint Grid Background ─────────────────────────────────────────────

export function ReviewGridBackground() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  );
}

// ─── Page Shell ─────────────────────────────────────────────────────────────
// Wraps every review page: background + centered container with max-w-4xl.

export function ReviewPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <ReviewGridBackground />
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {children}
      </div>
    </main>
  );
}

// ─── Page Header ────────────────────────────────────────────────────────────
// Animated h1 with an accented word + optional subtitle.

export function ReviewPageHeader({
  title,
  accentText,
  subtitle,
  accentColor = "text-amber dark:text-sparky-green",
}: {
  title?: string;
  accentText: string;
  subtitle?: string;
  accentColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
        {title && <>{title} </>}
        <span className={accentColor}>{accentText}</span>
      </h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </motion.div>
  );
}

// ─── Loading Spinner ────────────────────────────────────────────────────────
// Full-page or inline centered spinner.

export function ReviewLoadingState({ color = "text-amber" }: { color?: string }) {
  return (
    <ReviewPageShell>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`h-8 w-8 animate-spin ${color}`} />
      </div>
    </ReviewPageShell>
  );
}

// ─── Answer Option ──────────────────────────────────────────────────────────

function getOptionClasses(
  index: number,
  selectedAnswer: number | null,
  correctAnswer: number,
  isAnswered: boolean,
  hoverAccent: string,
): string {
  const base = "w-full text-left p-4 rounded-lg border-2 transition-all min-h-[56px] ";

  if (!isAnswered) {
    return base + `border-border dark:border-stone-800 ${hoverAccent} cursor-pointer pressable`;
  }

  if (index === correctAnswer) {
    return base + "border-emerald dark:border-sparky-green bg-emerald/10 dark:bg-sparky-green/10 text-foreground";
  }
  if (index === selectedAnswer && index !== correctAnswer) {
    return base + "border-red-500 bg-red-500/10 dark:border-red-400 dark:bg-red-400/10 text-foreground";
  }
  return base + "border-border dark:border-stone-800 opacity-50 text-muted-foreground";
}

function getLetterClasses(
  index: number,
  selectedAnswer: number | null,
  correctAnswer: number,
  isAnswered: boolean,
): string {
  const base = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ";

  if (isAnswered && index === correctAnswer) {
    return base + "bg-emerald text-white dark:bg-sparky-green dark:text-stone-950";
  }
  if (isAnswered && index === selectedAnswer && index !== correctAnswer) {
    return base + "bg-red-500 text-white";
  }
  return base + "bg-muted dark:bg-stone-800 text-muted-foreground";
}

// ─── Review Question Card ───────────────────────────────────────────────────
// Shared question + answer card used by Circuit Breaker, Weak Spots, and
// any future review mode. Matches the quiz QuestionCard style exactly.

export interface ReviewQuestionCardProps {
  /** The question to display. */
  question: Question;
  /** Currently selected answer index, or null. */
  selectedAnswer: number | null;
  /** Whether the answer has been submitted / revealed. */
  isAnswered: boolean;
  /** Called when the user taps an answer. */
  onSelectAnswer: (index: number) => void;
  /** NEC version for explanation rendering. */
  necVersion: NecVersion;
  /** Show the explanation section after answering (default: true). */
  showExplanation?: boolean;
  /** Show the NEC reference line inside the explanation (default: true). */
  showNecReference?: boolean;
  /** Show the Sparky Tip line inside the explanation (default: true). */
  showSparkyTip?: boolean;
  /** Accent color on answer hover (default: amber/sparky-green). */
  hoverAccent?: string;
  /** Ref forwarded to the explanation wrapper for scroll-into-view. */
  explanationRef?: React.Ref<HTMLDivElement>;
}

export function ReviewQuestionCard({
  question,
  selectedAnswer,
  isAnswered,
  onSelectAnswer,
  necVersion,
  showExplanation = true,
  showNecReference = true,
  showSparkyTip = true,
  hoverAccent = "hover:border-amber/50 dark:hover:border-sparky-green/50 hover:bg-amber/5 dark:hover:bg-sparky-green/5",
  explanationRef,
}: ReviewQuestionCardProps) {
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
            {/* Question Text */}
            <h2 className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
              {question.questionText}
            </h2>
          </CardContent>
        </Card>

        {/* Answer Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {question.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => onSelectAnswer(index)}
              disabled={isAnswered}
              whileTap={!isAnswered ? { scale: 0.97 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={getOptionClasses(index, selectedAnswer, question.correctAnswer, isAnswered, hoverAccent)}
            >
              <div className="flex items-start gap-3">
                <span className={getLetterClasses(index, selectedAnswer, question.correctAnswer, isAnswered)}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="pt-1 text-foreground text-sm md:text-base leading-relaxed">
                  {option}
                </span>
                {isAnswered && index === question.correctAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-emerald dark:text-sparky-green flex-shrink-0 ml-auto mt-1" />
                )}
                {isAnswered && index === selectedAnswer && index !== question.correctAnswer && (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-auto mt-1" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Explanation (shown after answer) */}
        {showExplanation && isAnswered && (
          <motion.div
            ref={explanationRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {getExplanation(question, necVersion)}
                </p>
                {showNecReference && (
                  <div className="flex items-center gap-1.5 text-emerald dark:text-sparky-green">
                    <BookOpen className="h-4 w-4" />
                    <p className="text-sm font-medium">
                      {getNecReference(question, necVersion)}
                    </p>
                  </div>
                )}
                {showSparkyTip && question.sparkyTip && (
                  <div className="flex items-center gap-1.5 text-amber">
                    <Zap className="h-3.5 w-3.5" />
                    <p className="text-xs">
                      {getSparkyTip(question, necVersion)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
