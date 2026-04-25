"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  Zap,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Trophy,
  Brain,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { BreakerModeHeader, TripAnimation, CooldownTimer, ResetButton } from "@/components/circuit-breaker";
import { getRandomQuestions, getQuestionById } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import { getScaffolding } from "@/lib/voltage";
import { ACTIVITY_VOLTAGE } from "@/lib/watts";
import { getCategoryBySlug } from "@/types/question";
import type { Question, CategorySlug, Difficulty } from "@/types/question";

const CORRECT_MESSAGES = [
  "Circuit holding! Keep that power flowing! ⚡",
  "Clean connection! The breaker stays closed!",
  "Solid answer! Your circuit is energized!",
  "Perfect! No fault detected — keep going!",
];

const WRONG_MESSAGES = [
  "Fault detected! One more wrong and the breaker trips!",
  "Overload warning! Be careful on the next one!",
  "Short circuit risk! Focus and think it through!",
];

const TRIP_MESSAGES = [
  "BREAKER TRIPPED! Two wrong answers overloaded the circuit. Time to reset and try again!",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function CircuitBreakerChallengePage() {
  const params = useParams();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const { necVersion } = useNecVersion();
  const categorySlug = params.category as CategorySlug;
  const category = getCategoryBySlug(categorySlug);

  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sparkyMessage, setSparkyMessage] = useState("");
  const [sparkyVariant, setSparkyVariant] = useState<"default" | "excited" | "warning" | "calm">("default");

  // Breaker state
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [isTripped, setIsTripped] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<Date | null>(null);
  const [showTripAnimation, setShowTripAnimation] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);

  // Session stats
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalWattsEarned, setTotalWattsEarned] = useState(0);
  const [wattsBalance, setWattsBalance] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const [loading, setLoading] = useState(true);
  const timerRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextButtonRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);
  const lastAnswerCorrectRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const scaffolding = getScaffolding(currentQuestion?.difficulty || "journeyman");

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Validate category
  if (!category) {
    router.push("/circuit-breaker");
    return null;
  }

  // Load questions and breaker state
  useEffect(() => {
    async function initialize() {
      try {
        // Load questions
        const qs = getRandomQuestions(categorySlug, 50, undefined, necVersion, true);
        setQuestions(qs);

        // Load breaker state and user data
        const [statusRes, userRes] = await Promise.all([
          fetch("/api/circuit-breaker/status"),
          fetch("/api/user"),
        ]);

        if (statusRes.ok) {
          const data = await statusRes.json();
          const breaker = data.breakers?.find(
            (b: { categorySlug: string }) => b.categorySlug === categorySlug
          );
          if (breaker) {
            setConsecutiveWrong(breaker.consecutiveWrong);
            setIsTripped(breaker.isTripped);
            if (breaker.isTripped && breaker.cooldownRemaining > 0) {
              setCooldownEndsAt(
                new Date(Date.now() + breaker.cooldownRemaining * 1000)
              );
            }
            setCurrentStreak(breaker.currentStreak);
            setBestStreak(breaker.bestStreak);
            setTotalTrips(breaker.totalTrips);
          }
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          setWattsBalance(userData.wattsBalance || 0);
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      } finally {
        setLoading(false);
      }
    }

    if (authStatus === "authenticated") {
      initialize();
    }
  }, [authStatus, categorySlug, necVersion]);

  // Timer
  useEffect(() => {
    if (!isAnswered && !isComplete && !isTripped && questions.length > 0) {
      timerRef.current = 0;
      timerIntervalRef.current = setInterval(() => {
        timerRef.current += 1;
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentIndex, isAnswered, isComplete, isTripped, questions.length]);

  const handleAnswer = useCallback(
    async (answerIndex: number) => {
      if (isAnswered || submitting || isTripped) return;

      const question = questions[currentIndex];
      if (!question) return;

      setSelectedAnswer(answerIndex);
      setIsAnswered(true);
      setSubmitting(true);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const isCorrect = answerIndex === question.correctAnswer;
      lastAnswerCorrectRef.current = isCorrect;

      if (isCorrect) {
        setTotalCorrect((prev) => prev + 1);
        setConsecutiveWrong(0);
        setCurrentStreak((prev) => {
          const newStreak = prev + 1;
          setBestStreak((best) => Math.max(best, newStreak));
          return newStreak;
        });
        setSparkyMessage(getRandomMessage(CORRECT_MESSAGES));
        setSparkyVariant(currentStreak >= 3 ? "excited" : "default");
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { x: 0.5, y: 0.7 },
          colors: ["#10B981", "#F59E0B", "#8B5CF6"],
        });
      } else {
        setCurrentStreak(0);
        setConsecutiveWrong((prev) => prev + 1);
      }

      setTotalAnswered((prev) => prev + 1);

      // Submit progress to API (also updates breaker state server-side)
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            isCorrect,
            timeSpentSeconds: timerRef.current,
            difficulty: question.difficulty,
          }),
        });

        if (res.ok) {
          const data = await res.json();

          // Track watts client-side (480V per correct answer)
          if (isCorrect) {
            setTotalWattsEarned((prev) => prev + ACTIVITY_VOLTAGE.circuit_breaker);
          }

          // Check if breaker just tripped
          if (data.breakerJustTripped) {
            setIsTripped(true);
            setTotalTrips((prev) => prev + 1);
            setCooldownEndsAt(new Date(Date.now() + 30 * 60 * 1000));
            setShowTripAnimation(true);
            setSparkyMessage(getRandomMessage(TRIP_MESSAGES));
            setSparkyVariant("warning");

            // Hide trip animation after 3 seconds
            setTimeout(() => setShowTripAnimation(false), 3000);
          } else if (!isCorrect) {
            setSparkyMessage(getRandomMessage(WRONG_MESSAGES));
            setSparkyVariant("calm");
          }
        }
      } catch (error) {
        console.error("Failed to submit progress:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [isAnswered, submitting, isTripped, questions, currentIndex]
  );

  async function handleNext() {
    if (currentIndex >= questions.length - 1) {
      setIsComplete(true);
      // Send watts to server on completion
      try {
        const sessionRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionType: "quiz", categorySlug }),
        });
        if (sessionRes.ok) {
          const { sessionId } = await sessionRes.json();
          const patchRes = await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              wattsEarned: totalWattsEarned,
              activityType: "circuit_breaker_clear",
              questionsAnswered: totalAnswered,
              questionsCorrect: totalCorrect,
            }),
          });
          if (patchRes.ok) {
            const data = await patchRes.json();
            if (typeof data.wattsBalance === "number") {
              setWattsBalance(data.wattsBalance);
              window.dispatchEvent(new CustomEvent("watts-updated", { detail: data.wattsBalance }));
            }
          }
        }
      } catch {
        // Silently fail
      }
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setSparkyMessage("");
    setSparkyVariant("default");
  }

  function handleCooldownExpired() {
    setIsTripped(false);
    setConsecutiveWrong(0);
    setCooldownEndsAt(null);
  }

  function handleBreakerReset() {
    setIsTripped(false);
    setConsecutiveWrong(0);
    setCooldownEndsAt(null);
    setWattsBalance((prev) => prev - 100);
  }

  if (loading || authStatus === "loading") {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)",
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
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/circuit-breaker"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">
              <span className="text-red-500">Circuit Breaker:</span>{" "}
              {category.name}
            </h1>
          </div>

          <BreakerModeHeader
            categoryName={category.name}
            consecutiveWrong={consecutiveWrong}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            totalTrips={totalTrips}
          />
        </motion.div>

        {/* Trip Animation Overlay */}
        <AnimatePresence>
          {showTripAnimation && (
            <TripAnimation categoryName={category.name} />
          )}
        </AnimatePresence>

        {/* Session Complete */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
              <CardContent className="p-8 text-center">
                <Trophy className="h-16 w-16 text-amber mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-display text-foreground mb-2">
                  Challenge Complete!
                </h2>
                <p className="text-muted-foreground mb-6">
                  {category.name} — {totalAnswered} questions
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
                      {totalAnswered > 0
                        ? Math.round((totalCorrect / totalAnswered) * 100)
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="bg-muted dark:bg-stone-800/50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-amber flex items-center justify-center gap-1">
                      <Zap className="h-5 w-5" />
                      {totalWattsEarned}
                    </p>
                    <p className="text-xs text-muted-foreground">Watts</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Link href="/circuit-breaker">
                    <Button variant="outline">All Categories</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button>Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tripped State — show cooldown + reset */}
        {isTripped && !isComplete && !showTripAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-500/30 dark:border-red-500/20 bg-card dark:bg-stone-900/50">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Breaker Tripped — {category.name}
                  </h2>
                  <p className="text-muted-foreground">
                    Wait for the cooldown or spend Watts to reset
                  </p>
                </div>

                {cooldownEndsAt && (
                  <div className="mb-6">
                    <CooldownTimer
                      cooldownEndsAt={cooldownEndsAt}
                      onExpired={handleCooldownExpired}
                    />
                  </div>
                )}

                <div className="flex justify-center mb-6">
                  <ResetButton
                    categorySlug={categorySlug}
                    wattsBalance={wattsBalance}
                    onReset={handleBreakerReset}
                  />
                </div>

                <SparkyMessage
                  size="medium"
                  message={sparkyMessage || "Take a breather! Use this time to review the concepts that tripped you up. The breaker will reset automatically, or spend some Watts to jump back in!"}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Quiz */}
        {!isTripped && !isComplete && currentQuestion && (
          <>
            {/* Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="flex items-center gap-1 capitalize">
                  {currentQuestion.difficulty}
                </span>
              </div>
              <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{
                    width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  }}
                  className="h-full bg-red-500/70 rounded-full"
                />
              </div>
            </motion.div>

            {/* Question */}
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
                      {currentQuestion.questionText}
                    </p>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option, i) => {
                        let style =
                          "border-border dark:border-stone-700 hover:border-red-500/50 dark:hover:border-red-500/50 hover:bg-red-500/5";

                        if (isAnswered) {
                          if (i === currentQuestion.correctAnswer) {
                            style =
                              "border-emerald dark:border-sparky-green bg-emerald/10 dark:bg-sparky-green/10";
                          } else if (
                            i === selectedAnswer &&
                            i !== currentQuestion.correctAnswer
                          ) {
                            style =
                              "border-red-500 bg-red-500/10 dark:border-red-400 dark:bg-red-400/10";
                          } else {
                            style =
                              "border-border dark:border-stone-700 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            disabled={isAnswered}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${style} ${
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
                              {isAnswered &&
                                i === currentQuestion.correctAnswer && (
                                  <CheckCircle2 className="h-5 w-5 text-emerald dark:text-sparky-green flex-shrink-0 ml-auto" />
                                )}
                              {isAnswered &&
                                i === selectedAnswer &&
                                i !== currentQuestion.correctAnswer && (
                                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-auto" />
                                )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {isAnswered && (
                      <motion.div
                        ref={explanationRef}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mt-6 pt-6 border-t border-border dark:border-stone-800"
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {getExplanation(currentQuestion, necVersion)}
                        </p>
                        {scaffolding.showNecReferences && (
                          <div className="flex items-center gap-1.5 text-emerald dark:text-sparky-green mb-2">
                            <BookOpen className="h-4 w-4" />
                            <p className="text-sm font-medium">
                              {getNecReference(currentQuestion, necVersion)}
                            </p>
                          </div>
                        )}
                        {scaffolding.showFormulas &&
                          currentQuestion.sparkyTip && (
                            <div className="flex items-center gap-1.5 text-amber">
                              <Zap className="h-3.5 w-3.5" />
                              <p className="text-xs">
                                {getSparkyTip(currentQuestion, necVersion)}
                              </p>
                            </div>
                          )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Sparky + Next */}
                {isAnswered && !isTripped && (
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
                      <SparkyMessage size="medium" message={sparkyMessage} variant={sparkyVariant} />
                    )}
                    <div className="flex justify-center">
                      <Button onClick={handleNext} size="lg">
                        {currentIndex < questions.length - 1 ? (
                          <>
                            Next Question
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        ) : (
                          <>
                            Finish
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
        )}
      </div>
    </main>
  );
}
