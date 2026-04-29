"use client";

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Bookmark,
  ChevronRight,
  Loader2,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { getRandomQuestionsAll } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import type { Question } from "@/types/question";

const QUESTION_COUNTS = [10, 20, 30] as const;

function ApprenticeQuizContent() {
  const { status } = useSession();
  const router = useRouter();
  const { necVersion } = useNecVersion();

  // Phase: "select" (pick count) or "playing" (answering questions)
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [bestStreak, setBestStreak] = useState(0);
  const streakRef = useRef(0);
  const explanationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const startQuiz = useCallback((count: number) => {
    const allApprentice = getRandomQuestionsAll(9999, necVersion)
      .filter((q) => q.difficulty === "apprentice" && !q.calculation);
    // Shuffle and take the requested count
    const shuffled = [...allApprentice].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, Math.min(count, shuffled.length)));
    setQuestionCount(count);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswers(new Map());
    setBookmarked(new Set());
    setBestStreak(0);
    streakRef.current = 0;
  }, [necVersion]);

  const currentQuestion = questions[currentIdx];

  const handleAnswer = useCallback((answerIdx: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(answerIdx);
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, answerIdx));

    if (answerIdx === currentQuestion.correctAnswer) {
      streakRef.current += 1;
      if (streakRef.current > bestStreak) setBestStreak(streakRef.current);
    } else {
      streakRef.current = 0;
    }

    // Scroll to explanation after a brief delay for the UI to render
    setTimeout(() => {
      explanationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [selectedAnswer, currentQuestion, bestStreak]);

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      // Quiz complete — store results and navigate to results page
      const answersObject = Object.fromEntries(answers);
      sessionStorage.setItem("quizAnswers", JSON.stringify(answersObject));
      sessionStorage.setItem("quizQuestionIds", JSON.stringify(questions.map((q) => q.id)));
      sessionStorage.setItem("quizCategory", "all");
      sessionStorage.setItem("bookmarkedQuestions", JSON.stringify(Array.from(bookmarked)));
      sessionStorage.setItem("bestStreak", String(bestStreak));
      sessionStorage.setItem("quizAnswerVoltages", JSON.stringify([]));
      sessionStorage.setItem("quizPassed", "true");
      sessionStorage.setItem("quizFinalWatts", "0");
      sessionStorage.setItem("quizDifficulty", "apprentice");
      router.push("/quiz/all/results");
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  }, [currentIdx, questions, answers, bookmarked, bestStreak, router]);

  const toggleBookmark = useCallback(() => {
    if (!currentQuestion) return;
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  }, [currentQuestion]);

  const correct = answers.get(currentQuestion?.id ?? "") === currentQuestion?.correctAnswer;
  const necRef = currentQuestion ? getNecReference(currentQuestion, necVersion) : "";
  const explanation = currentQuestion ? getExplanation(currentQuestion, necVersion) : "";
  const sparkyTip = currentQuestion ? getSparkyTip(currentQuestion, necVersion) : "";

  // Count selector screen
  if (!questionCount) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="container mx-auto px-4 py-8 relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <GraduationCap className="h-12 w-12 text-amber dark:text-sparky-green mx-auto mb-3" />
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              <span className="text-amber dark:text-sparky-green">Apprentice</span> Quiz
            </h1>
            <p className="text-muted-foreground text-sm">
              Apprentice-level questions from all categories. No calculations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-8"
          >
            <SparkyMessage size="medium" message="Start here! These questions cover the fundamentals every apprentice needs to know before stepping onto the job site." />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            <p className="text-sm font-medium text-center text-muted-foreground mb-2">
              How many questions?
            </p>
            {QUESTION_COUNTS.map((count, i) => (
              <motion.button
                key={count}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }}
                onClick={() => startQuiz(count)}
                className="w-full text-left p-4 rounded-xl border border-amber/30 dark:border-sparky-green/20 hover:border-amber/60 dark:hover:border-sparky-green/40 bg-card dark:bg-stone-900/50 hover:bg-amber/5 dark:hover:bg-sparky-green/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-amber dark:text-sparky-green">
                      {count} Questions
                    </span>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {count === 10 ? "Quick practice" : count === 20 ? "Standard session" : "Deep review"}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-amber dark:group-hover:text-sparky-green group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </main>
    );
  }

  // Loading state
  if (!currentQuestion) {
    return (
      <main className="min-h-screen bg-cream dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  // Quiz playing screen
  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-6 relative z-10 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber dark:text-sparky-green" />
            <span className="text-sm font-bold text-foreground">Apprentice Quiz</span>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {currentIdx + 1}/{questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted-foreground/10 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-amber/60 dark:bg-sparky-green/60 rounded-full"
            animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800 mb-6">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    {necRef}
                  </span>
                  <button onClick={toggleBookmark} className="shrink-0">
                    <Bookmark
                      className={`h-4 w-4 transition-colors ${
                        bookmarked.has(currentQuestion.id)
                          ? "fill-amber text-amber dark:fill-sparky-green dark:text-sparky-green"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-base font-medium text-foreground leading-relaxed">
                  {currentQuestion.questionText}
                </p>
              </CardContent>
            </Card>

            {/* Answer options */}
            <div className="space-y-2 mb-6">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrectAnswer = idx === currentQuestion.correctAnswer;
                const hasAnswered = selectedAnswer !== null;

                let btnClass = "border-border dark:border-stone-700 text-foreground hover:bg-muted";
                if (hasAnswered) {
                  if (isCorrectAnswer) {
                    btnClass = "border-emerald bg-emerald/10 text-emerald dark:border-sparky-green dark:bg-sparky-green/10 dark:text-sparky-green";
                  } else if (isSelected) {
                    btnClass = "border-red-500 bg-red-500/10 text-red-500";
                  } else {
                    btnClass = "border-border dark:border-stone-800 text-muted-foreground opacity-60";
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-3 rounded-xl border transition-colors text-sm ${btnClass} ${!hasAnswered ? "cursor-pointer" : "cursor-default"}`}
                    whileTap={!hasAnswered ? { scale: 0.98 } : undefined}
                  >
                    <div className="flex items-start gap-2">
                      {hasAnswered && isCorrectAnswer && <CheckCircle2 className="h-4 w-4 text-emerald dark:text-sparky-green shrink-0 mt-0.5" />}
                      {hasAnswered && isSelected && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                      <span>{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation (after answering) */}
            {selectedAnswer !== null && (
              <motion.div
                ref={explanationRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <Card className={`border ${correct ? "border-emerald/30 dark:border-sparky-green/20" : "border-red-500/20"} bg-card dark:bg-stone-900/50`}>
                  <CardContent className="p-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 ${correct ? 'text-emerald dark:text-sparky-green' : 'text-red-500'}">
                      {correct ? "Correct!" : "Incorrect"}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {explanation}
                    </p>
                    {sparkyTip && (
                      <div className="flex items-start gap-2 pt-2 border-t border-border dark:border-stone-800">
                        <Zap className="h-3.5 w-3.5 text-amber dark:text-sparky-green shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground italic">{sparkyTip}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleNext}
                  className="w-full mt-4 bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                >
                  {currentIdx + 1 >= questions.length ? "See Results" : "Next Question"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function ApprenticeQuizPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    }>
      <ApprenticeQuizContent />
    </Suspense>
  );
}
