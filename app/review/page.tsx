"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  BookOpen,
  ChevronLeft,
  Loader2,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { CATEGORIES } from "@/types/question";
import { getQuestionById } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import { getScaffolding } from "@/lib/voltage";
import { ACTIVITY_VOLTAGE } from "@/lib/watts";
import type { Question } from "@/types/question";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WeakSpotQuestion {
  questionId: string;
  category: string;
  difficulty: string;
  timesCorrect: number;
  timesWrong: number;
  lastReviewDate: string | null;
}

// ─── Messages ───────────────────────────────────────────────────────────────

const CORRECT_MESSAGES = [
  "Nice! You just turned a weak spot into a strong point! ⚡",
  "That one used to trip you up — not anymore!",
  "Conquered! One less weak spot to worry about.",
  "You're patching those gaps like a pro!",
  "Correct! That knowledge is getting reinforced!",
];

const INCORRECT_MESSAGES = [
  "This one's still tricky — but now you've seen it again. That helps!",
  "Not quite. Review the explanation — you'll nail it next time!",
  "Still a weak spot, but every attempt builds the connection.",
  "Keep at it! Repetition is how you turn weak spots into strengths.",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen bg-cream dark:bg-stone-950">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-amber" />
          </div>
        </main>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}

function ReviewContent() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <GridBackground />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <GridBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              <span className="text-amber dark:text-sparky-green">
                Weak Spots
              </span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            Questions you&apos;ve missed the most — conquer them for 120W each!
          </p>
        </motion.div>

        <WeakSpotsQuiz />
      </div>
    </main>
  );
}

// ─── Grid Background ────────────────────────────────────────────────────────

function GridBackground() {
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

// ─── Weak Spots Quiz ─────────────────────────────────────────────────────────

function WeakSpotsQuiz() {
  const { necVersion } = useNecVersion();
  const [weakSpots, setWeakSpots] = useState<WeakSpotQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWattsEarned, setTotalWattsEarned] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [sparkyMessage, setSparkyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextButtonRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);
  const lastAnswerCorrectRef = useRef(false);

  const currentDifficulty = weakSpots[currentIndex]?.difficulty || "journeyman";
  const scaffolding = getScaffolding(currentDifficulty);

  // Load weak spots
  useEffect(() => {
    async function loadWeakSpots() {
      try {
        const res = await fetch("/api/review/weak-spots?limit=20");
        if (res.ok) {
          const data = await res.json();
          setWeakSpots(data.questions || []);
        }
      } catch (error) {
        console.error("Failed to load weak spots:", error);
      } finally {
        setLoading(false);
      }
    }
    loadWeakSpots();
  }, []);

  // Create study session when starting
  useEffect(() => {
    if (weakSpots.length > 0 && !sessionId && !loading) {
      createSession();
    }
  }, [weakSpots, loading]);

  // Timer for answer speed tracking
  useEffect(() => {
    if (!isAnswered && !isComplete && weakSpots.length > 0) {
      timerRef.current = 0;
      timerIntervalRef.current = setInterval(() => {
        timerRef.current += 1;
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentIndex, isAnswered, isComplete, weakSpots.length]);

  async function createSession() {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionType: "flashcard", categorySlug: null }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }

  async function handleAnswer(answerIndex: number) {
    if (isAnswered || submitting) return;

    const wsQ = weakSpots[currentIndex];
    const question = getQuestionById(wsQ.questionId);
    if (!question) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    setSubmitting(true);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const isCorrect = answerIndex === question.correctAnswer;
    lastAnswerCorrectRef.current = isCorrect;
    if (isCorrect) {
      setTotalCorrect((prev) => prev + 1);
      setSparkyMessage(getRandomMessage(CORRECT_MESSAGES));
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { x: 0.5, y: 0.7 },
        colors: ["#F59E0B", "#10B981", "#8B5CF6"],
      });
    } else {
      setSparkyMessage(getRandomMessage(INCORRECT_MESSAGES));
    }

    // Track watts earned (120W per correct answer for weak spots)
    if (isCorrect) {
      setTotalWattsEarned((prev) => prev + ACTIVITY_VOLTAGE.weak_spots);
    }

    // Submit progress (this updates SRS state on the server)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: wsQ.questionId,
          isCorrect,
          timeSpentSeconds: timerRef.current,
          difficulty: wsQ.difficulty,
        }),
      });
    } catch (error) {
      console.error("Failed to submit progress:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (currentIndex >= weakSpots.length - 1) {
      await completeSession();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setSparkyMessage("");
  }

  async function completeSession() {
    setIsComplete(true);

    if (sessionId) {
      try {
        const res = await fetch("/api/review/weak-spots/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionsReviewed: weakSpots.length,
            questionsCorrect: totalCorrect,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.wattsBalance === "number") {
            window.dispatchEvent(new CustomEvent("watts-updated", { detail: data.wattsBalance }));
          }
        }
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    // Celebration confetti only for 70%+ accuracy
    const accuracy = weakSpots.length > 0 ? (totalCorrect / weakSpots.length) * 100 : 0;
    if (accuracy >= 70) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#F59E0B", "#10B981", "#8B5CF6", "#A3FF00"],
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </div>
    );
  }

  // No weak spots
  if (weakSpots.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-12 text-center border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CheckCircle2 className="h-16 w-16 text-emerald dark:text-sparky-green mx-auto mb-4" />
          <h2 className="text-xl font-semibold font-display text-foreground mb-2">
            No weak spots found!
          </h2>
          <p className="text-muted-foreground mb-6">
            You haven&apos;t missed any questions yet, or your weak spots were
            already reviewed today. Keep studying to build your review history!
          </p>
          <Link href="/quiz">
            <Button>
              <Brain className="h-4 w-4 mr-2" />
              Start a Quiz
            </Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  // Session complete
  if (isComplete) {
    const accuracy =
      weakSpots.length > 0
        ? Math.round((totalCorrect / weakSpots.length) * 100)
        : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-amber mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">
              Weak Spots Session Complete!
            </h2>
            <p className="text-muted-foreground mb-6">
              You tackled {weakSpots.length} weak spot
              {weakSpots.length !== 1 ? "s" : ""}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
              <div className="bg-muted dark:bg-stone-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-emerald dark:text-sparky-green">
                  {totalCorrect}
                </p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="bg-muted dark:bg-stone-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-foreground">
                  {accuracy}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="bg-muted dark:bg-stone-800/50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber flex items-center justify-center gap-1">
                  <Zap className="h-5 w-5" />
                  {totalWattsEarned}
                </p>
                <p className="text-xs text-muted-foreground">Watts Earned</p>
              </div>
            </div>

            <SparkyMessage
              size="medium"
              message={
                accuracy >= 80
                  ? "Outstanding! You're turning those weak spots into strengths! ⚡"
                  : accuracy >= 60
                    ? "Good effort! The ones you missed will show up again — keep at it!"
                    : "Every attempt makes you stronger. Come back tomorrow to tackle these again!"
              }
            />

            <div className="flex gap-3 justify-center mt-6">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/quiz">
                <Button>
                  <Brain className="h-4 w-4 mr-2" />
                  Practice More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Active quiz — show current question
  const wsQ = weakSpots[currentIndex];
  const question = getQuestionById(wsQ.questionId);
  const category = CATEGORIES.find((c) => c.slug === wsQ.category);
  const progress = ((currentIndex + 1) / weakSpots.length) * 100;

  if (!question) {
    // Question not found in bank — skip it
    handleNext();
    return null;
  }

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Question {currentIndex + 1} of {weakSpots.length}
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber" />
            Missed {wsQ.timesWrong} time{wsQ.timesWrong !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-amber dark:bg-sparky-green rounded-full"
          />
        </div>
      </motion.div>

      {/* Question Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-wrap gap-2 mb-4"
      >
        <span className="text-xs text-emerald dark:text-sparky-green font-medium px-2 py-0.5 rounded bg-emerald/10 dark:bg-sparky-green/10">
          {category?.name || wsQ.category}
        </span>
        <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-muted dark:bg-stone-800">
          {wsQ.difficulty}
        </span>
        <span className="text-xs text-amber font-medium px-2 py-0.5 rounded bg-amber/10">
          {wsQ.timesWrong}x missed
        </span>
      </motion.div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardContent className="p-6">
              <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed mb-6">
                {question.questionText}
              </p>

              {/* Answer Options */}
              <div className="space-y-3">
                {question.options.map((option, i) => {
                  let optionStyle =
                    "border-border dark:border-stone-700 hover:border-amber/50 dark:hover:border-sparky-green/50 hover:bg-amber/5 dark:hover:bg-sparky-green/5";

                  if (isAnswered) {
                    if (i === question.correctAnswer) {
                      optionStyle =
                        "border-emerald dark:border-sparky-green bg-emerald/10 dark:bg-sparky-green/10";
                    } else if (
                      i === selectedAnswer &&
                      i !== question.correctAnswer
                    ) {
                      optionStyle =
                        "border-red-500 bg-red-500/10 dark:border-red-400 dark:bg-red-400/10";
                    } else {
                      optionStyle =
                        "border-border dark:border-stone-700 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionStyle} ${
                        !isAnswered ? "cursor-pointer pressable" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted dark:bg-stone-700 flex items-center justify-center text-sm font-medium text-muted-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-foreground text-sm md:text-base leading-relaxed">
                          {option}
                        </span>
                        {isAnswered && i === question.correctAnswer && (
                          <CheckCircle2 className="h-5 w-5 text-emerald dark:text-sparky-green flex-shrink-0 ml-auto" />
                        )}
                        {isAnswered &&
                          i === selectedAnswer &&
                          i !== question.correctAnswer && (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-auto" />
                          )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (shown after answer — scaffolding applies) */}
              {isAnswered && (
                <motion.div
                  ref={explanationRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-6 pt-6 border-t border-border dark:border-stone-800"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {getExplanation(question, necVersion)}
                  </p>
                  {scaffolding.showNecReferences && (
                    <div className="flex items-center gap-1.5 text-emerald dark:text-sparky-green mb-2">
                      <BookOpen className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        {getNecReference(question, necVersion)}
                      </p>
                    </div>
                  )}
                  {scaffolding.showFormulas && question.sparkyTip && (
                    <div className="flex items-center gap-1.5 text-amber">
                      <Zap className="h-3.5 w-3.5" />
                      <p className="text-xs">
                        {getSparkyTip(question, necVersion)}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Sparky Message + Next Button */}
          {isAnswered && (
            <motion.div
              ref={nextButtonRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onAnimationComplete={() => {
                if (lastAnswerCorrectRef.current) {
                  nextButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                  explanationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="space-y-4"
            >
              {sparkyMessage && (
                <SparkyMessage size="medium" message={sparkyMessage} />
              )}
              <div className="flex justify-center">
                <Button onClick={handleNext} size="lg">
                  {currentIndex < weakSpots.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Finish Session
                      <Trophy className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
