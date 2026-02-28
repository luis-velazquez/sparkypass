"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import {
  ChevronLeft,
  Book,
  ArrowRight,
  CheckCircle2,
  XCircle,

} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SparkyMessage } from "@/components/sparky";
import { getQuestionById } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import type { Question } from "@/types/question";

// Sparky congratulation messages for correct answers
const CORRECT_MESSAGES = [
  "Excellent work! You're mastering those bookmarked challenges! ⚡",
  "That's the right answer! Your review is paying off!",
  "Perfect! You're conquering your weak spots, future Master Electrician!",
  "Brilliant! You really learned from last time! 🔥",
  "Outstanding! This bookmark is ready to be retired!",
  "You nailed it! Review sessions are working!",
  "Correct! You're turning weaknesses into strengths!",
  "Yes! That's the power of focused review!",
  "Fantastic! Your persistence is shining through!",
  "Spot on! Those study sessions are paying off!",
];

// Sparky encouragement messages for incorrect answers
const INCORRECT_MESSAGES = [
  "Not quite, but reviewing is exactly how you improve! Let's look at this one.",
  "Close! This one still needs some work. Let's review it together.",
  "That's okay! Some concepts need multiple reviews. Here's the key insight:",
  "Don't worry! Keep this bookmarked - we'll get it next time.",
  "Almost there! Let's reinforce this concept. Here's the explanation:",
  "Learning moment! Repetition is key to mastery. Let's review:",
  "No worries! This is why we review. Here's what to remember:",
  "That's a tricky one! Here's what the NEC says about this:",
];

const XP_PER_CORRECT_ANSWER = 25;

// Get a random message from an array
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Fire confetti celebration
function fireConfetti() {
  haptic("celebration");
  confetti({
    particleCount: 80,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors: ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB"],
  });
  confetti({
    particleCount: 80,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors: ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB"],
  });
}

interface ReviewState {
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  answers: Map<string, number>;
  isSubmitted: boolean;
  showXpAnimation: boolean;
  sparkyMessage: string;
}

function createInitialReviewState(): ReviewState {
  return {
    currentQuestionIndex: 0,
    selectedAnswer: null,
    answers: new Map(),
    isSubmitted: false,
    showXpAnimation: false,
    sparkyMessage: "",
  };
}

// Inner component that handles the actual review quiz
function BookmarkReviewQuiz({ initialQuestions }: { initialQuestions: Question[] }) {
  const router = useRouter();
  const { necVersion } = useNecVersion();
  const questions = useMemo(() => initialQuestions, [initialQuestions]);
  const [reviewState, setReviewState] = useState<ReviewState>(createInitialReviewState);
  const xpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    currentQuestionIndex,
    selectedAnswer,
    answers,
    isSubmitted,
    showXpAnimation,
    sparkyMessage,
  } = reviewState;

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage =
    totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  const isCorrectAnswer =
    isSubmitted && selectedAnswer === currentQuestion?.correctAnswer;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (xpTimeoutRef.current) {
        clearTimeout(xpTimeoutRef.current);
      }
    };
  }, []);

  // Fetch and save pre-review XP on mount for level-up detection
  useEffect(() => {
    async function fetchPreQuizXP() {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const userData = await response.json();
          sessionStorage.setItem("preQuizXP", String(userData.xp || 0));
        }
      } catch {
        // Silently fail - level-up detection just won't work
      }
    }
    fetchPreQuizXP();
  }, []);

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    setReviewState((prev) => {
      if (prev.isSubmitted) return prev;
      return {
        ...prev,
        selectedAnswer: answerIndex,
      };
    });
  }, []);

  const handleSubmitAnswer = useCallback(() => {
    setReviewState((prev) => {
      if (prev.selectedAnswer === null) return prev;
      const question = questions[prev.currentQuestionIndex];
      if (!question) return prev;

      const newAnswers = new Map(prev.answers);
      newAnswers.set(question.id, prev.selectedAnswer);

      const isCorrect = prev.selectedAnswer === question.correctAnswer;
      const message = isCorrect
        ? getRandomMessage(CORRECT_MESSAGES)
        : getRandomMessage(INCORRECT_MESSAGES);

      if (isCorrect) {
        fireConfetti();
        xpTimeoutRef.current = setTimeout(() => {
          setReviewState((p) => ({ ...p, showXpAnimation: false }));
        }, 2000);
      }

      return {
        ...prev,
        answers: newAnswers,
        isSubmitted: true,
        showXpAnimation: isCorrect,
        sparkyMessage: message,
      };
    });
  }, [questions]);

  const handleNextQuestion = useCallback(() => {
    const isLast = currentQuestionIndex >= totalQuestions - 1;

    if (isLast) {
      // Navigate to results
      const answersObject = Object.fromEntries(answers);
      sessionStorage.setItem("quizAnswers", JSON.stringify(answersObject));
      sessionStorage.setItem(
        "quizQuestionIds",
        JSON.stringify(questions.map((q) => q.id))
      );
      sessionStorage.setItem("quizCategory", "bookmarks");
      sessionStorage.setItem("bookmarkedQuestions", JSON.stringify([]));
      router.push("/bookmarks/review/results");
    } else {
      if (xpTimeoutRef.current) {
        clearTimeout(xpTimeoutRef.current);
        xpTimeoutRef.current = null;
      }
      setReviewState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswer: null,
        isSubmitted: false,
        showXpAnimation: false,
        sparkyMessage: "",
      }));
    }
  }, [currentQuestionIndex, totalQuestions, answers, questions, router]);

  const handleExit = useCallback(() => {
    sessionStorage.removeItem("bookmarkReviewIds");
    router.push("/bookmarks");
  }, [router]);

  return (
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-6 max-w-4xl">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Header Label */}
      <div className="relative z-10 mb-4 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Bookmark Review</span>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mb-6">
        <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber to-amber-light rounded-full"
          />
        </div>
      </div>

      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Exit
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Exit Review?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to exit? Your progress will be lost and
                you&apos;ll need to start over.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Review</AlertDialogCancel>
              <AlertDialogAction onClick={handleExit}>
                Exit Review
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <span className="text-sm font-medium text-muted-foreground">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>

        <div className="w-20" />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <Card className="mb-6 border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
            <CardContent className="pt-6">
              {/* NEC Reference Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-soft dark:bg-purple/10 text-purple text-sm font-medium">
                  <Book className="h-3.5 w-3.5" />
                  {getNecReference(currentQuestion, necVersion)}
                </span>
                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-muted dark:bg-stone-800">
                  {currentQuestion.difficulty}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
                {currentQuestion.questionText}
              </h2>
            </CardContent>
          </Card>

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = isSubmitted && isCorrect;
              const showIncorrect = isSubmitted && isSelected && !isCorrect;

              let optionClasses =
                "w-full p-4 text-left rounded-lg border-2 transition-all ";

              if (showCorrect) {
                optionClasses +=
                  "border-emerald bg-emerald/10 text-foreground";
              } else if (showIncorrect) {
                optionClasses += "border-red-500 bg-red-500/10 text-foreground";
              } else if (isSelected) {
                optionClasses += "border-amber bg-amber/10 text-foreground";
              } else if (isSubmitted) {
                optionClasses +=
                  "border-border bg-muted/50 dark:bg-stone-800/50 text-muted-foreground";
              } else {
                optionClasses +=
                  "border-border hover:border-amber/50 hover:bg-muted/50 dark:hover:bg-stone-800/50 cursor-pointer";
              }

              return (
                <motion.button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={isSubmitted}
                  className={optionClasses}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        showCorrect
                          ? "bg-emerald text-white"
                          : showIncorrect
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-amber text-white"
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

          {/* Feedback Section - Shows after answer is submitted */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                {/* XP Animation for correct answers */}
                {showXpAnimation && isCorrectAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                    className="flex justify-center mb-4"
                  >
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/20 text-emerald rounded-full text-lg font-bold">
                      <CheckCircle2 className="h-5 w-5" />+{XP_PER_CORRECT_ANSWER} XP
                    </span>
                  </motion.div>
                )}

                {/* Sparky Feedback Message */}
                <Card
                  className={`${isCorrectAnswer ? "border-emerald/50" : "border-amber/50"}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      {isCorrectAnswer ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald/20 text-emerald text-sm font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Correct!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          Not Quite
                        </span>
                      )}
                    </div>

                    {/* Sparky Message */}
                    <SparkyMessage
                      message={sparkyMessage}
                      size="medium"
                      className="mb-4"
                    />

                    {/* Explanation */}
                    <div className="mt-4 p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Book className="h-4 w-4 text-purple" />
                        Explanation
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                        {getExplanation(currentQuestion, necVersion)}
                      </p>
                      <p className="text-sm text-purple font-medium">
                        Reference: {getNecReference(currentQuestion, necVersion)}
                      </p>
                    </div>

                    {/* Sparky Tip */}
                    <div className="mt-3 p-3 bg-amber/10 rounded-lg border border-amber/30">
                      <p className="text-sm text-foreground">
                        <span className="font-medium text-amber">
                          Sparky&apos;s Tip:
                        </span>{" "}
                        {getSparkyTip(currentQuestion, necVersion)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {!isSubmitted ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                size="lg"
                className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                size="lg"
                className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-2"
              >
                {isLastQuestion ? "See Results" : "Next Question"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-6 max-w-4xl">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative z-10 mb-6">
        <div className="h-2 bg-muted dark:bg-stone-800 animate-pulse rounded-full" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="h-40 bg-muted dark:bg-stone-800 animate-pulse rounded-lg" />
        <div className="h-20 bg-muted dark:bg-stone-800 animate-pulse rounded-lg" />
        <div className="h-20 bg-muted dark:bg-stone-800 animate-pulse rounded-lg" />
      </div>
    </main>
  );
}

// Helper to load and shuffle questions from sessionStorage
function loadQuestionsFromSession(): Question[] | null {
  if (typeof window === "undefined") return null;

  const bookmarkIds = sessionStorage.getItem("bookmarkReviewIds");
  if (!bookmarkIds) return null;

  try {
    const ids: string[] = JSON.parse(bookmarkIds);
    const loadedQuestions = ids
      .map((id) => getQuestionById(id))
      .filter((q): q is Question => q !== undefined);

    if (loadedQuestions.length === 0) return null;

    // Shuffle using a seeded random based on timestamp for consistency
    const shuffled = [...loadedQuestions].sort(() => Math.random() - 0.5);
    return shuffled;
  } catch {
    return null;
  }
}

// Main page component that handles data loading
export default function BookmarkReviewPage() {
  const router = useRouter();
  // Use lazy initialization with a factory function
  const [state] = useState(() => {
    const questions = loadQuestionsFromSession();
    return { questions, isClient: typeof window !== "undefined" };
  });

  // Handle redirect for SSR and invalid state
  useEffect(() => {
    // Only redirect on client-side when we know there are no questions
    if (state.isClient && state.questions === null) {
      router.replace("/bookmarks");
    }
  }, [state.isClient, state.questions, router]);

  // During SSR or while redirecting, show loading
  if (!state.isClient || state.questions === null) {
    return <LoadingSkeleton />;
  }

  return <BookmarkReviewQuiz initialQuestions={state.questions} />;
}
