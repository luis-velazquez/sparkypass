"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import {
  Star,
  StarOff,
  ChevronLeft,
  Book,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  XCircle,
  Flame,
  Loader2,
  Zap,
  Trophy,
  Calendar,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { QuestionCard } from "@/components/quiz-engine";
import {
  CORRECT_MESSAGES,
  INCORRECT_MESSAGES,
  ON_FIRE_MESSAGES,
  STREAK_BROKEN_MESSAGES,
  STREAK_THRESHOLD,
  getRandomMessage,
} from "@/components/quiz-engine/sparky-messages";
import { getRandomQuestionsAll, getQuestionById } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import type { Question } from "@/types/question";
import { ACTIVITY_VOLTAGE } from "@/lib/watts";
import { getStreakBoostedVoltage } from "@/lib/voltage";

const DAILY_PROGRESS_KEY = "sparkypass-daily-challenge-progress";

interface SavedProgress {
  date: string;
  questionIds: string[];
  currentQuestionIndex: number;
  answers: Record<string, number>;
  bookmarkedQuestions: string[];
  correctStreak: number;
  bestStreak: number;
  sessionId: string | null;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function saveProgress(state: QuizState, sessionId: string | null) {
  const data: SavedProgress = {
    date: getTodayKey(),
    questionIds: state.questions.map((q) => q.id),
    currentQuestionIndex: state.currentQuestionIndex,
    answers: Object.fromEntries(state.answers),
    bookmarkedQuestions: Array.from(state.bookmarkedQuestions),
    correctStreak: state.correctStreak,
    bestStreak: state.bestStreak,
    sessionId,
  };
  localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(data));
}

function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(DAILY_PROGRESS_KEY);
    if (!raw) return null;
    const data: SavedProgress = JSON.parse(raw);
    if (data.date !== getTodayKey()) {
      localStorage.removeItem(DAILY_PROGRESS_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function clearProgress() {
  localStorage.removeItem(DAILY_PROGRESS_KEY);
}

const XP_PER_CORRECT_ANSWER = 25;
const DAILY_QUESTION_COUNT = 5;

function fireConfetti(level: number = 0) {
  haptic("celebration");
  const colors = ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB", "#A3FF00"];
  const sideCount = level >= 1 ? 120 : 80;

  confetti({
    particleCount: sideCount,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors,
  });
  confetti({
    particleCount: sideCount,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors,
  });
}

// Particle burst from answer button (used during fire streaks)
function ParticleBurst({ x, y, id, streak = 3 }: { x: number; y: number; id: number; streak?: number }) {
  const particles = useMemo(() => {
    const count = Math.min(50 + streak * 5, 100);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360 + (Math.random() * 15 - 7.5);
      const rad = (angle * Math.PI) / 180;
      const distance = 130 + Math.random() * 200;
      const size = 10 + Math.random() * 18;
      const shapeRoll = Math.random();
      const shape: "circle" | "square" | "diamond" =
        shapeRoll < 0.6 ? "circle" : shapeRoll < 0.85 ? "square" : "diamond";
      return {
        id: i,
        tx: Math.cos(rad) * distance,
        ty: Math.sin(rad) * distance + 40,
        size,
        shape,
        color: ["#F59E0B", "#EF4444", "#F97316", "#FBBF24", "#10B981", "#FDE68A", "#FB923C"][i % 7],
        delay: Math.random() * 0.12,
      };
    });
  }, [streak]);

  return (
    <div
      key={id}
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1.5 }}
          animate={{
            x: p.tx,
            y: p.ty,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 1.1,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : "2px",
            backgroundColor: p.color,
            boxShadow: `0 0 4px 1px ${p.color}`,
            transform: p.shape === "diamond" ? "rotate(45deg)" : undefined,
          }}
        />
      ))}
    </div>
  );
}

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  bookmarkedQuestions: Set<string>;
  answers: Map<string, number>;
  isSubmitted: boolean;
  showXpAnimation: boolean;
  sparkyMessage: string;
  showHint: boolean;
  correctStreak: number;
  bestStreak: number;
  showOnFire: boolean;
  streakBroken: boolean;
}

type PagePhase = "loading" | "completed" | "quiz" | "results";

interface CompletionData {
  xpEarned: number;
  studyStreak: number;
  bestStudyStreak: number;
}

interface ResultsData {
  score: number;
  total: number;
  xpEarned: number;
  bestStreak: number;
}

export default function DailyChallengePage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const { necVersion } = useNecVersion();

  const [phase, setPhase] = useState<PagePhase>("loading");
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [studyStreak, setStudyStreak] = useState(0);
  const [answerVoltages, setAnswerVoltages] = useState<number[]>([]);

  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    selectedAnswer: null,
    bookmarkedQuestions: new Set<string>(),
    answers: new Map(),
    isSubmitted: false,
    showXpAnimation: false,
    sparkyMessage: "",
    showHint: false,
    correctStreak: 0,
    bestStreak: 0,
    showOnFire: false,
    streakBroken: false,
  });

  const { questions, currentQuestionIndex, selectedAnswer, bookmarkedQuestions, answers, isSubmitted, sparkyMessage, correctStreak, bestStreak, showOnFire, streakBroken } = quizState;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  const isCorrectAnswer = isSubmitted && selectedAnswer === currentQuestion?.correctAnswer;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const isOnFireStreak = correctStreak >= STREAK_THRESHOLD;
  const isBookmarked = currentQuestion ? bookmarkedQuestions.has(currentQuestion.id) : false;

  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const answerButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [particleBurst, setParticleBurst] = useState<{ x: number; y: number; id: number } | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Initialize: check daily challenge status and set up quiz
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    async function initialize() {
      try {
        // Check if daily challenge is already completed
        const statsRes = await fetch("/api/progress/stats");
        if (!statsRes.ok) {
          // If stats fail, still start the quiz
          startQuiz();
          return;
        }

        const stats = await statsRes.json();
        setStudyStreak(stats.studyStreak || 0);

        if (stats.dailyChallengeCompleted) {
          clearProgress();
          setCompletionData({
            xpEarned: stats.dailyChallengeXpEarned || 0,
            studyStreak: stats.studyStreak || 0,
            bestStudyStreak: stats.bestStudyStreak || 0,
          });
          setPhase("completed");
          return;
        }

        // Check for saved in-progress quiz
        const saved = loadProgress();
        if (saved) {
          const restoredQuestions = saved.questionIds
            .map((id) => getQuestionById(id))
            .filter((q): q is Question => q !== undefined);

          if (restoredQuestions.length === saved.questionIds.length) {
            // Restore session ID
            if (saved.sessionId) {
              sessionStorage.setItem("currentSessionId", saved.sessionId);
            }

            // Fetch fresh bookmarks
            let bookmarkedIds = new Set<string>(saved.bookmarkedQuestions);
            try {
              const bookmarksRes = await fetch("/api/bookmarks");
              if (bookmarksRes.ok) {
                const bookmarksData = await bookmarksRes.json();
                bookmarkedIds = new Set<string>(
                  bookmarksData.bookmarks.map((b: { questionId: string }) => b.questionId)
                );
              }
            } catch { /* use saved bookmarks */ }

            setQuizState({
              questions: restoredQuestions,
              currentQuestionIndex: saved.currentQuestionIndex,
              selectedAnswer: null,
              bookmarkedQuestions: bookmarkedIds,
              answers: new Map(Object.entries(saved.answers).map(([k, v]) => [k, v])),
              isSubmitted: false,
              showXpAnimation: false,
              sparkyMessage: "",
              showHint: false,
              correctStreak: saved.correctStreak,
              bestStreak: saved.bestStreak,
              showOnFire: false,
              streakBroken: false,
            });
            setPhase("quiz");
            return;
          }
        }

        startQuiz();
      } catch {
        // On error, just start the quiz
        startQuiz();
      }
    }

    async function startQuiz() {
      const dailyQuestions = getRandomQuestionsAll(DAILY_QUESTION_COUNT, necVersion);

      // Create session and fetch bookmarks in parallel
      try {
        const [userRes, bookmarksRes, sessionRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/bookmarks"),
          fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionType: "daily_challenge" }),
          }),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          sessionStorage.setItem("preQuizXP", String(userData.wattsBalance || 0));
        }

        let bookmarkedIds = new Set<string>();
        if (bookmarksRes.ok) {
          const bookmarksData = await bookmarksRes.json();
          bookmarkedIds = new Set<string>(
            bookmarksData.bookmarks.map((b: { questionId: string }) => b.questionId)
          );
        }

        let newSessionId: string | null = null;
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          newSessionId = sessionData.sessionId;
          sessionStorage.setItem("currentSessionId", sessionData.sessionId);
        }

        const newState: QuizState = {
          questions: dailyQuestions,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          bookmarkedQuestions: bookmarkedIds,
          answers: new Map(),
          isSubmitted: false,
          showXpAnimation: false,
          sparkyMessage: "",
          showHint: false,
          correctStreak: 0,
          bestStreak: 0,
          showOnFire: false,
          streakBroken: false,
        };
        setQuizState(newState);
        saveProgress(newState, newSessionId);
      } catch {
        // Even if API calls fail, still load questions
        setQuizState((prev) => ({
          ...prev,
          questions: dailyQuestions,
        }));
      }

      setPhase("quiz");
    }

    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, necVersion]);

  const handleSubmitAnswer = useCallback(async (answerOverride?: number) => {
    const { questions, currentQuestionIndex } = quizState;
    const selectedAnswer = answerOverride ?? quizState.selectedAnswer;
    if (selectedAnswer === null) return;

    const question = questions[currentQuestionIndex];
    if (!question) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    haptic(isCorrect ? "success" : "error");

    // Track voltage earned for this correct answer (streak boost applied)
    if (isCorrect) {
      const currentVoltage = getStreakBoostedVoltage("journeyman", quizState.correctStreak);
      setAnswerVoltages((prev) => [...prev, currentVoltage]);
    }

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, isCorrect }),
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }

    setQuizState((prev) => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(question.id, selectedAnswer);

      const newStreak = isCorrect ? prev.correctStreak + 1 : 0;
      const justHitStreak = isCorrect && newStreak >= STREAK_THRESHOLD && prev.correctStreak < STREAK_THRESHOLD;
      const isOnFire = newStreak >= STREAK_THRESHOLD;
      const wasOnFire = prev.correctStreak >= STREAK_THRESHOLD;
      const streakJustBroken = !isCorrect && wasOnFire;

      let message: string;
      if (streakJustBroken) {
        message = getRandomMessage(STREAK_BROKEN_MESSAGES);
      } else if (justHitStreak) {
        message = getRandomMessage(ON_FIRE_MESSAGES);
      } else if (isCorrect && isOnFire) {
        message = `🔥 ${newStreak} in a row! ${getRandomMessage(CORRECT_MESSAGES)}`;
      } else if (isCorrect) {
        message = getRandomMessage(CORRECT_MESSAGES);
      } else {
        message = getRandomMessage(INCORRECT_MESSAGES);
      }

      if (isCorrect) {
        if (isOnFire && selectedAnswer !== null) {
          const btn = answerButtonRefs.current[selectedAnswer];
          if (btn) {
            const rect = btn.getBoundingClientRect();
            setParticleBurst({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              id: Date.now(),
            });
          }
        }

        fireConfetti(0);
      }

      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);

      const newBestStreak = Math.max(prev.bestStreak, newStreak);

      const updatedState = {
        ...prev,
        answers: newAnswers,
        isSubmitted: true,
        showXpAnimation: isCorrect,
        sparkyMessage: message,
        correctStreak: newStreak,
        bestStreak: newBestStreak,
        showOnFire: isCorrect && isOnFire,
        streakBroken: streakJustBroken,
        showHint: false,
      };

      // Persist progress after each answer
      const sid = sessionStorage.getItem("currentSessionId");
      saveProgress(updatedState, sid);

      return updatedState;
    });
  }, [quizState]);

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    if (quizState.isSubmitted) return;
    haptic("tap");
    setQuizState((prev) => {
      if (prev.isSubmitted) return prev;
      return { ...prev, selectedAnswer: answerIndex };
    });
    handleSubmitAnswer(answerIndex);
  }, [quizState.isSubmitted, handleSubmitAnswer]);

  const handleToggleBookmark = useCallback(async () => {
    const question = quizState.questions[quizState.currentQuestionIndex];
    if (!question) return;

    const isCurrentlyBookmarked = quizState.bookmarkedQuestions.has(question.id);

    setQuizState((prev) => {
      const newBookmarks = new Set(prev.bookmarkedQuestions);
      if (isCurrentlyBookmarked) {
        newBookmarks.delete(question.id);
      } else {
        newBookmarks.add(question.id);
      }
      return { ...prev, bookmarkedQuestions: newBookmarks };
    });

    try {
      if (isCurrentlyBookmarked) {
        await fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id }),
        });
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id }),
        });
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      setQuizState((prev) => {
        const newBookmarks = new Set(prev.bookmarkedQuestions);
        if (isCurrentlyBookmarked) {
          newBookmarks.add(question.id);
        } else {
          newBookmarks.delete(question.id);
        }
        return { ...prev, bookmarkedQuestions: newBookmarks };
      });
    }
  }, [quizState.questions, quizState.currentQuestionIndex, quizState.bookmarkedQuestions]);

  const handleNextQuestion = useCallback(async () => {
    const isLast = currentQuestionIndex >= totalQuestions - 1;

    if (isLast) {
      // Calculate results using voltage × amps
      let correctCount = 0;
      questions.forEach((q) => {
        if (answers.get(q.id) === q.correctAnswer) {
          correctCount++;
        }
      });
      // Daily challenge always passes (no pass/fail penalty)
      const wattsEarned = answerVoltages.reduce((sum, v) => sum + v, 0);

      // End the session
      const sessionId = sessionStorage.getItem("currentSessionId");
      if (sessionId) {
        try {
          const sessionRes = await fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              wattsEarned,
              activityType: "daily_challenge",
              questionsAnswered: answers.size,
              questionsCorrect: correctCount,
            }),
          });
          if (sessionRes.ok) {
            const data = await sessionRes.json();
            if (typeof data.wattsBalance === "number") {
              window.dispatchEvent(new CustomEvent("watts-updated", { detail: data.wattsBalance }));
            }
          }
        } catch {
          // Silently fail
        }
      }

      clearProgress();
      setResultsData({
        score: correctCount,
        total: totalQuestions,
        xpEarned: wattsEarned,
        bestStreak,
      });
      setPhase("results");
    } else {
      setQuizState((prev) => {
        const updatedState = {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          selectedAnswer: null,
          isSubmitted: false,
          showXpAnimation: false,
          sparkyMessage: "",
          showHint: false,
        };
        const sid = sessionStorage.getItem("currentSessionId");
        saveProgress(updatedState, sid);
        return updatedState;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex, totalQuestions, answers, questions, bestStreak]);

  const handleBookmarkFromFeedback = useCallback(async () => {
    const question = quizState.questions[quizState.currentQuestionIndex];
    if (!question) return;

    setQuizState((prev) => {
      const newBookmarks = new Set(prev.bookmarkedQuestions);
      newBookmarks.add(question.id);
      return { ...prev, bookmarkedQuestions: newBookmarks };
    });

    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
    } catch (error) {
      console.error("Failed to save bookmark:", error);
      setQuizState((prev) => {
        const newBookmarks = new Set(prev.bookmarkedQuestions);
        newBookmarks.delete(question.id);
        return { ...prev, bookmarkedQuestions: newBookmarks };
      });
    }
  }, [quizState.questions, quizState.currentQuestionIndex]);

  const handleExit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // Shake animation for streak break
  const shakeAnimation = streakBroken
    ? { x: [0, -10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.5 } }
    : {};

  // --- LOADING STATE ---
  if (authStatus === "loading" || phase === "loading") {
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
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  // --- ALREADY COMPLETED TODAY ---
  if (phase === "completed" && completionData) {
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
        <div className="container mx-auto px-4 py-8 max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
              <CardHeader className="text-center">
                <div className="w-20 h-20 rounded-full bg-emerald/10 dark:bg-sparky-green/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-emerald dark:text-sparky-green" />
                </div>
                <CardTitle className="text-2xl font-display text-foreground">
                  Challenge Complete!
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  You&apos;ve already completed today&apos;s daily challenge. Come back tomorrow for a fresh set!
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                    <Zap className="h-6 w-6 text-amber dark:text-sparky-green mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground dark:text-sparky-green">
                      +{completionData.xpEarned}
                    </p>
                    <p className="text-sm text-muted-foreground">XP Earned</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                    <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground dark:text-sparky-green">
                      {completionData.studyStreak}
                    </p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                    <Trophy className="h-6 w-6 text-amber mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground dark:text-sparky-green">
                      {completionData.bestStudyStreak}
                    </p>
                    <p className="text-sm text-muted-foreground">Best Streak</p>
                  </div>
                </div>

                <SparkyMessage
                  size="medium"
                  message="Great job completing today's challenge! Consistency is the key to passing the exam. See you tomorrow! ⚡"
                />

                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full bg-purple hover:bg-purple/90 text-white"
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    );
  }

  // --- INLINE RESULTS ---
  if (phase === "results" && resultsData) {
    const percentage = Math.round((resultsData.score / resultsData.total) * 100);
    const isPerfect = resultsData.score === resultsData.total;
    const isGreat = percentage >= 80;

    const resultMessage = isPerfect
      ? "PERFECT SCORE! You absolutely crushed today's challenge! ⚡🔥"
      : isGreat
      ? "Excellent work on today's challenge! You're well on your way to passing the exam!"
      : percentage >= 60
      ? "Good effort! Keep practicing daily and you'll see those scores climb!"
      : "Every question is a learning opportunity! Come back tomorrow and show what you've learned!";

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
        <div className="container mx-auto px-4 py-8 max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
              <CardHeader className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isPerfect
                    ? "bg-amber/10"
                    : isGreat
                    ? "bg-emerald/10 dark:bg-sparky-green/10"
                    : "bg-purple/10"
                }`}>
                  {isPerfect ? (
                    <Trophy className="h-10 w-10 text-amber" />
                  ) : isGreat ? (
                    <CheckCircle2 className="h-10 w-10 text-emerald dark:text-sparky-green" />
                  ) : (
                    <Calendar className="h-10 w-10 text-purple" />
                  )}
                </div>
                <CardTitle className="text-2xl font-display text-foreground">
                  Daily Challenge Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score */}
                <div className="text-center">
                  <p className="text-5xl font-bold text-foreground dark:text-sparky-green">
                    {resultsData.score}/{resultsData.total}
                  </p>
                  <p className="text-muted-foreground mt-1">{percentage}% correct</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                    <Zap className="h-6 w-6 text-amber dark:text-sparky-green mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground dark:text-sparky-green">
                      +{resultsData.xpEarned}
                    </p>
                    <p className="text-sm text-muted-foreground">XP Earned</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                    <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground dark:text-sparky-green">
                      {studyStreak}
                    </p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                    <Trophy className="h-6 w-6 text-amber mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground dark:text-sparky-green">
                      {resultsData.bestStreak}
                    </p>
                    <p className="text-sm text-muted-foreground">Best Streak</p>
                  </div>
                </div>

                {/* Watts earned */}
                <div className="flex items-center justify-center gap-2 p-3 bg-amber/10 rounded-lg">
                  <Zap className="h-5 w-5 text-amber fill-current" />
                  <span className="text-lg font-bold text-amber">
                    +{resultsData.xpEarned}W earned
                  </span>
                </div>

                <SparkyMessage size="medium" message={resultMessage} />

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-purple hover:bg-purple/90 text-white"
                  >
                    Back to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/quiz")}
                    className="w-full border-border dark:border-stone-700"
                  >
                    Practice More Questions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    );
  }

  // --- QUIZ FLOW ---
  if (phase !== "quiz" || !currentQuestion) {
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
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Quick green flash on correct answer */}
      <AnimatePresence>
        {isSubmitted && isCorrectAnswer && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 pointer-events-none z-50 bg-emerald/15 dark:bg-sparky-green/10"
          />
        )}
      </AnimatePresence>

      {/* Particle burst from answer button during fire streak */}
      {particleBurst && (
        <ParticleBurst
          key={particleBurst.id}
          x={particleBurst.x}
          y={particleBurst.y}
          id={particleBurst.id}
          streak={correctStreak}
        />
      )}

      <motion.main
        className="relative min-h-screen bg-cream dark:bg-stone-950"
        animate={shakeAnimation}
      >
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
          {/* Progress Bar - hidden on mobile */}
          <div className="hidden md:block mb-6">
            <div className={`h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden transition-shadow duration-500 ${
              isOnFireStreak ? "shadow-[0_0_12px_3px_rgba(249,115,22,0.6)]" : ""
            }`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isOnFireStreak
                    ? "bg-gradient-to-r from-orange-500 via-amber to-red-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
                    : "bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark"
                }`}
              />
            </div>
          </div>

          {/* Navigation Bar - hidden on mobile */}
          <div className="hidden md:flex items-center justify-between gap-3 mb-6">
            {/* Left - Exit */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="default" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Exit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Exit Daily Challenge?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to exit? Your progress is saved — you can pick up where you left off.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExit}>Exit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Center - Question counter, streak, label */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {currentQuestionIndex + 1} / {totalQuestions}
              </span>
              {correctStreak >= STREAK_THRESHOLD && (
                <motion.span
                  key={correctStreak}
                  initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-bold border bg-gradient-to-r from-orange-500/15 to-red-500/15 text-orange-500 border-orange-500/25"
                >
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }}
                  >
                    <Flame className="h-3 w-3" />
                  </motion.span>
                  {correctStreak}
                </motion.span>
              )}
              <span className="text-xs text-muted-foreground">
                Daily Challenge
              </span>
            </div>

            {/* Right - Bookmark + Submit/Next */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleToggleBookmark}
                className={`gap-2 ${isBookmarked ? "text-amber border-amber" : ""}`}
              >
                {isBookmarked ? (
                  <Star className="h-4 w-4 fill-amber" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
                {isBookmarked ? "Saved" : "Save"}
              </Button>

              {isSubmitted && (
                <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Button
                    onClick={handleNextQuestion}
                    size="default"
                    className="bg-amber hover:bg-amber/90 text-white gap-2 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                  >
                    {isLastQuestion ? "See Results" : "Next"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Question Card + Answer Options */}
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitted={isSubmitted}
            onSelectAnswer={handleSelectAnswer}
            necVersion={necVersion}
            answerButtonRefs={answerButtonRefs}
            showHint={quizState.showHint}
            onToggleHint={() => setQuizState(prev => ({ ...prev, showHint: !prev.showHint }))}
          />

              {/* Mobile Next Button */}
              {isSubmitted && (
                <div className="flex justify-center mb-6 md:hidden">
                  <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="w-full">
                    <Button
                      onClick={handleNextQuestion}
                      size="lg"
                      className="bg-amber hover:bg-amber/90 text-white gap-2 w-full dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                    >
                      {isLastQuestion ? "See Results" : "Next Question"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Desktop Next Button - below answers so user doesn't scroll up */}
              {isSubmitted && (
                <div className="hidden md:flex justify-end mb-6">
                  <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                    <Button
                      onClick={handleNextQuestion}
                      size="default"
                      className="bg-amber hover:bg-amber/90 text-white gap-2 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                    >
                      {isLastQuestion ? "See Results" : "Next"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Mobile Progress Bar & Nav */}
              <div className="md:hidden mb-4">
                <div className={`h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden transition-shadow duration-500 mb-3 ${
                  isOnFireStreak ? "shadow-[0_0_12px_3px_rgba(249,115,22,0.6)]" : ""
                }`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOnFireStreak
                        ? "bg-gradient-to-r from-orange-500 via-amber to-red-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
                        : "bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  {/* Left - Exit */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Exit Daily Challenge?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to exit? Your progress is saved — you can pick up where you left off.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Continue</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExit}>Exit</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Center - Question counter + label */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {currentQuestionIndex + 1} / {totalQuestions}
                    </span>
                    {correctStreak >= STREAK_THRESHOLD && (
                      <motion.span
                        key={correctStreak}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-bold bg-gradient-to-r from-orange-500/15 to-red-500/15 text-orange-500 border border-orange-500/25"
                      >
                        <Flame className="h-3 w-3" />
                        {correctStreak}
                      </motion.span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Daily Challenge
                    </span>
                  </div>

                  {/* Right - Bookmark */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleBookmark}
                    className={`h-9 w-9 ${isBookmarked ? "text-amber border-amber" : ""}`}
                  >
                    {isBookmarked ? (
                      <Star className="h-4 w-4 fill-amber" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Feedback Section */}
              <AnimatePresence>
                {isSubmitted && (
                  <motion.div
                    ref={feedbackRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="mb-6"
                  >
                    {/* XP and Streak badges */}
                    <div className="flex justify-center gap-3 mb-4 flex-wrap">
                      {isCorrectAnswer && (
                        <motion.span
                          initial={{ opacity: 0, y: 20, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/20 text-emerald dark:bg-sparky-green/20 dark:text-sparky-green rounded-full text-lg font-bold"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          +{XP_PER_CORRECT_ANSWER} XP
                        </motion.span>
                      )}
                      {isCorrectAnswer && (
                        <motion.span
                          initial={{ opacity: 0, y: 20, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.5, type: "spring", bounce: 0.4, delay: 0.15 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber/20 text-amber rounded-full text-lg font-bold"
                        >
                          <Zap className="h-5 w-5 fill-current" />
                          +{ACTIVITY_VOLTAGE.daily_challenge}W
                        </motion.span>
                      )}
                      {correctStreak >= STREAK_THRESHOLD && (
                        <motion.span
                          key={`feedback-streak-${correctStreak}`}
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full font-bold border bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-500 border-orange-500/30"
                        >
                          <motion.span
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }}
                          >
                            <Flame className="h-5 w-5" />
                          </motion.span>
                          {correctStreak} Streak!
                        </motion.span>
                      )}
                    </div>

                    {/* Sparky Feedback Message */}
                    <Card className={`${isCorrectAnswer ? "border-emerald/50 dark:border-sparky-green/50" : "border-amber/50"}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          {isCorrectAnswer ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald/20 text-emerald dark:bg-sparky-green/20 dark:text-sparky-green text-sm font-medium">
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

                        <SparkyMessage message={sparkyMessage} size="medium" variant={isCorrectAnswer ? "default" : "calm"} className="mb-4" />

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
                            📖 Reference: {getNecReference(currentQuestion, necVersion)}
                          </p>
                        </div>

                        {/* Sparky Tip */}
                        {getSparkyTip(currentQuestion, necVersion) && (
                          <div className="mt-3 p-3 bg-amber/10 dark:bg-sparky-green/10 rounded-lg border border-amber/30 dark:border-sparky-green/30">
                            <p className="text-sm text-foreground">
                              <span className="font-medium text-amber dark:text-sparky-green">💡 Sparky&apos;s Tip:</span>{" "}
                              {getSparkyTip(currentQuestion, necVersion)}
                            </p>
                          </div>
                        )}

                        {/* Bookmark suggestion for incorrect answers */}
                        {!isCorrectAnswer && !isBookmarked && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 flex items-center justify-center"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleBookmarkFromFeedback}
                              className="gap-2 border-amber text-amber hover:bg-amber/10 dark:border-sparky-green dark:text-sparky-green dark:hover:bg-sparky-green/10"
                            >
                              <Bookmark className="h-4 w-4" />
                              Save this question for later review
                            </Button>
                          </motion.div>
                        )}

                        {!isCorrectAnswer && isBookmarked && (
                          <div className="mt-4 flex items-center justify-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 text-amber dark:bg-sparky-green/10 dark:text-sparky-green rounded-full text-sm">
                              <Star className="h-4 w-4 fill-amber dark:fill-sparky-green" />
                              Saved for review
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Bottom Next Button */}
                    <div className="flex justify-center mt-6">
                      <Button
                        onClick={handleNextQuestion}
                        size="lg"
                        className="bg-amber hover:bg-amber/90 text-white gap-2 px-8 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                      >
                        {isLastQuestion ? "See Results" : "Next Question"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
        </div>
      </motion.main>
    </>
  );
}
