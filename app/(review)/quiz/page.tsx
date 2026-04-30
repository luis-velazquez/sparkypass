"use client";

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Bookmark,
  Loader2,
  Zap,
  Calculator,
  Ban,
  Layers,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { getRandomQuestionsAll } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import { haptic } from "@/lib/haptics";
import type { Question, Difficulty } from "@/types/question";

const QUESTION_COUNTS = [10, 20, 30] as const;
const STREAK_THRESHOLD = 3;
const MILESTONES = [5, 10, 15, 20];

type QuestionType = "calculations" | "non-calculations" | "both";

// ─── Confetti with intensity levels ─────────────────────────────────────────

function fireConfetti(level: number = 0) {
  haptic("celebration");
  const colors = ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB", "#A3FF00"];
  const sideCount = level >= 4 ? 200 : level >= 3 ? 180 : level >= 2 ? 150 : level >= 1 ? 120 : 80;

  confetti({ particleCount: sideCount, spread: 55, origin: { x: 0, y: 0.7 }, colors });
  confetti({ particleCount: sideCount, spread: 55, origin: { x: 1, y: 0.7 }, colors });

  if (level >= 2) {
    confetti({ particleCount: level >= 3 ? 120 : 80, spread: 100, origin: { x: 0.5, y: 0 }, colors, gravity: 1.2 });
  }
  if (level === 3) {
    setTimeout(() => {
      confetti({ particleCount: 120, spread: 70, origin: { x: 0.3, y: 0.5 }, colors });
      confetti({ particleCount: 120, spread: 70, origin: { x: 0.7, y: 0.5 }, colors });
    }, 300);
  }
  if (level >= 4) {
    [500, 1000, 1500, 2000].forEach((delay) => {
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 80, origin: { x: Math.random(), y: Math.random() * 0.4 }, colors });
      }, delay);
    });
  }
}

// ─── Milestone Banner ───────────────────────────────────────────────────────

function MilestoneBanner({ streak }: { streak: number }) {
  const config = streak >= 20
    ? { text: "GODLIKE!", gradient: "from-yellow-400 via-amber to-orange-500", size: "text-4xl md:text-6xl", sub: "Absolute perfection!" }
    : streak >= 15
    ? { text: "LEGENDARY!", gradient: "from-red-500 via-orange-500 to-yellow-400", size: "text-3xl md:text-5xl", sub: "Unbelievable streak!" }
    : streak >= 10
    ? { text: "UNSTOPPABLE!", gradient: "from-orange-500 via-red-500 to-orange-500", size: "text-3xl md:text-5xl", sub: "You're on another level!" }
    : { text: "ON FIRE!", gradient: "from-orange-400 to-red-500", size: "text-2xl md:text-4xl", sub: "Keep it going!" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: [0.3, 1.05, 1] }}
      exit={{ opacity: 0, scale: 1.3, y: -30 }}
      transition={{ duration: 0.6, scale: { type: "tween", duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } }}
      className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none"
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30" />
      <div className="relative flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <motion.span animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.3 }}>
            <Flame className={`${streak >= 15 ? "h-10 w-10" : "h-8 w-8"} text-orange-500`} />
          </motion.span>
          <motion.p
            animate={streak >= 15 ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`${config.size} font-black bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent drop-shadow-lg`}
          >
            {config.text} {streak}!
          </motion.p>
          <motion.span animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.3 }}>
            <Flame className={`${streak >= 15 ? "h-10 w-10" : "h-8 w-8"} text-orange-500`} />
          </motion.span>
        </div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-white/80 text-sm md:text-base font-medium">
          {config.sub}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── Sparky Messages ────────────────────────────────────────────────────────

const CORRECT_MSGS = ["Nailed it!", "That's the one!", "Clean answer!", "Right on the money!", "You know your code!"];
const INCORRECT_MSGS = ["Not quite — review the explanation!", "Close, but check the reference.", "Good try! The code says otherwise."];
const STREAK_MSGS = ["You're on fire! Keep that streak alive!", "Unstoppable! The code is second nature to you!"];

function randomMsg(arr: string[]): string { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Config ─────────────────────────────────────────────────────────────────

const DIFFICULTIES: { value: Difficulty; label: string; desc: string; color: string; border: string }[] = [
  { value: "journeyman", label: "Journeyman", desc: "Intermediate NEC knowledge and application", color: "text-amber dark:text-amber", border: "border-amber/30 hover:border-amber/60" },
  { value: "master", label: "Master", desc: "Advanced code interpretation and scenarios", color: "text-red-500 dark:text-red-400", border: "border-red-500/30 hover:border-red-500/60" },
];

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string; icon: typeof Calculator }[] = [
  { value: "calculations", label: "Calculations", desc: "Math-based NEC problems", icon: Calculator },
  { value: "non-calculations", label: "Knowledge", desc: "Conceptual and code knowledge questions", icon: Ban },
  { value: "both", label: "Both", desc: "Full mix of all question types", icon: Layers },
];

// ─── Quiz Content ───────────────────────────────────────────────────────────

function QuizContent() {
  const { status } = useSession();
  const router = useRouter();
  const { necVersion } = useNecVersion();

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [bestStreak, setBestStreak] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sparkyMsg, setSparkyMsg] = useState("");
  const [milestoneBanner, setMilestoneBanner] = useState<number | null>(null);
  const [streakBroken, setStreakBroken] = useState(false);
  const explanationRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const startQuiz = useCallback((count: number) => {
    let pool = getRandomQuestionsAll(9999, necVersion).filter((q) => q.difficulty === difficulty);
    if (questionType === "calculations") pool = pool.filter((q) => q.calculation);
    else if (questionType === "non-calculations") pool = pool.filter((q) => !q.calculation);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, Math.min(count, shuffled.length)));
    setQuestionCount(count);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswers(new Map());
    setBookmarked(new Set());
    setBestStreak(0);
    setStreak(0);
    setSparkyMsg("");
    setStreakBroken(false);
  }, [necVersion, difficulty, questionType]);

  const currentQuestion = questions[currentIdx];

  const handleAnswer = useCallback((answerIdx: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(answerIdx);
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, answerIdx));

    const isCorrect = answerIdx === currentQuestion.correctAnswer;
    haptic(isCorrect ? "success" : "error");

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setStreakBroken(false);

      // Confetti
      const isMilestone = MILESTONES.includes(newStreak);
      const confettiLevel = isMilestone ? (newStreak >= 20 ? 4 : newStreak >= 15 ? 3 : newStreak >= 10 ? 2 : 1) : 0;
      fireConfetti(confettiLevel);

      // Milestone banner
      if (isMilestone) {
        setMilestoneBanner(newStreak);
        setTimeout(() => setMilestoneBanner(null), 2500);
      }

      // Sparky message
      if (newStreak >= STREAK_THRESHOLD) {
        setSparkyMsg(`🔥 ${newStreak} in a row! ${randomMsg(CORRECT_MSGS)}`);
      } else {
        setSparkyMsg(randomMsg(CORRECT_MSGS));
      }

      setTimeout(() => {
        nextButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    } else {
      const wasOnFire = streak >= STREAK_THRESHOLD;
      setStreak(0);
      setStreakBroken(wasOnFire);
      setSparkyMsg(randomMsg(INCORRECT_MSGS));

      setTimeout(() => {
        explanationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [selectedAnswer, currentQuestion, streak, bestStreak]);

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      const answersObject = Object.fromEntries(answers);
      sessionStorage.setItem("quizAnswers", JSON.stringify(answersObject));
      sessionStorage.setItem("quizQuestionIds", JSON.stringify(questions.map((q) => q.id)));
      sessionStorage.setItem("quizCategory", "all");
      sessionStorage.setItem("bookmarkedQuestions", JSON.stringify(Array.from(bookmarked)));
      sessionStorage.setItem("bestStreak", String(bestStreak));
      sessionStorage.setItem("quizAnswerVoltages", JSON.stringify([]));
      sessionStorage.setItem("quizPassed", "true");
      sessionStorage.setItem("quizFinalWatts", "0");
      if (difficulty) sessionStorage.setItem("quizDifficulty", difficulty);
      router.push("/quiz/all/results");
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setSparkyMsg("");
      setStreakBroken(false);
    }
  }, [currentIdx, questions, answers, bookmarked, bestStreak, difficulty, router]);

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
  const isOnFire = streak >= STREAK_THRESHOLD;

  const blueprintBg = (
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{
      backgroundImage: "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
    }} />
  );

  // ─── Step 1: Difficulty ────────────────────────────────────────────────────
  if (!difficulty) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        {blueprintBg}
        <div className="container mx-auto px-4 py-8 relative z-10 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-amber dark:text-sparky-green mx-auto mb-3" />
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              <span className="text-amber dark:text-sparky-green">Practice</span> Quiz
            </h1>
            <p className="text-muted-foreground text-sm">Questions from all NEC categories</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="mb-8">
            <SparkyMessage size="medium" message="Pick your level! Journeyman covers the core code applications. Master pushes into advanced interpretation and edge cases." />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-3">
            <p className="text-sm font-medium text-center text-muted-foreground mb-2">Select difficulty</p>
            {DIFFICULTIES.map((diff, i) => (
              <motion.button key={diff.value} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }}
                onClick={() => setDifficulty(diff.value)}
                className={`w-full text-left p-4 rounded-xl border ${diff.border} bg-card dark:bg-stone-900/50 hover:bg-amber/5 dark:hover:bg-sparky-green/5 transition-all cursor-pointer group`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-lg font-bold ${diff.color}`}>{diff.label}</span>
                    <p className="text-sm text-muted-foreground mt-0.5">{diff.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Step 2: Question Type ─────────────────────────────────────────────────
  if (!questionType) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        {blueprintBg}
        <div className="container mx-auto px-4 py-8 relative z-10 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-amber dark:text-sparky-green mx-auto mb-3" />
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              <span className="text-amber dark:text-sparky-green">{difficulty === "journeyman" ? "Journeyman" : "Master"}</span> Quiz
            </h1>
            <p className="text-muted-foreground text-sm">What type of questions?</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-3">
            <p className="text-sm font-medium text-center text-muted-foreground mb-2">Select question type</p>
            {QUESTION_TYPES.map((type, i) => {
              const Icon = type.icon;
              return (
                <motion.button key={type.value} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
                  onClick={() => setQuestionType(type.value)}
                  className="w-full text-left p-4 rounded-xl border border-border dark:border-stone-800 hover:border-amber/40 dark:hover:border-sparky-green/30 bg-card dark:bg-stone-900/50 hover:bg-amber/5 dark:hover:bg-sparky-green/5 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4.5 w-4.5 text-amber dark:text-sparky-green" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-foreground">{type.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.button>
              );
            })}
            <button onClick={() => setDifficulty(null)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 cursor-pointer">
              <ChevronLeft className="h-3 w-3 inline mr-1" />Back to difficulty
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Step 3: Question Count ────────────────────────────────────────────────
  if (!questionCount) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        {blueprintBg}
        <div className="container mx-auto px-4 py-8 relative z-10 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-amber dark:text-sparky-green mx-auto mb-3" />
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              <span className="text-amber dark:text-sparky-green">{difficulty === "journeyman" ? "Journeyman" : "Master"}</span> Quiz
            </h1>
            <p className="text-muted-foreground text-sm">
              {questionType === "calculations" ? "Calculations only" : questionType === "non-calculations" ? "Knowledge questions only" : "All question types"}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-3">
            <p className="text-sm font-medium text-center text-muted-foreground mb-2">How many questions?</p>
            {QUESTION_COUNTS.map((count, i) => (
              <motion.button key={count} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
                onClick={() => startQuiz(count)}
                className="w-full text-left p-4 rounded-xl border border-amber/30 dark:border-sparky-green/20 hover:border-amber/60 dark:hover:border-sparky-green/40 bg-card dark:bg-stone-900/50 hover:bg-amber/5 dark:hover:bg-sparky-green/5 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-amber dark:text-sparky-green">{count} Questions</span>
                    <p className="text-sm text-muted-foreground mt-0.5">{count === 10 ? "Quick practice" : count === 20 ? "Standard session" : "Deep review"}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-amber dark:group-hover:text-sparky-green group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.button>
            ))}
            <button onClick={() => setQuestionType(null)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 cursor-pointer">
              <ChevronLeft className="h-3 w-3 inline mr-1" />Back to question type
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <main className="min-h-screen bg-cream dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  // ─── Quiz Playing ──────────────────────────────────────────────────────────
  const diffLabel = difficulty === "journeyman" ? "Journeyman" : "Master";

  return (
    <motion.main
      animate={streakBroken ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      key={`shake-${streakBroken ? currentIdx : "none"}`}
      className="relative min-h-screen bg-cream dark:bg-stone-950"
    >
      {blueprintBg}
      <div className="container mx-auto px-4 py-6 relative z-10 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber dark:text-sparky-green" />
            <span className="text-sm font-bold text-foreground">{diffLabel} Quiz</span>
            {isOnFire && (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="flex items-center gap-1 text-xs font-bold text-orange-500"
              >
                <Flame className="h-3.5 w-3.5" /> {streak}
              </motion.span>
            )}
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {currentIdx + 1}/{questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted-foreground/10 rounded-full mb-6 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isOnFire ? "bg-orange-500" : "bg-amber/60 dark:bg-sparky-green/60"}`}
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
            <Card className={`bg-card dark:bg-stone-900/50 border-border dark:border-stone-800 mb-6 transition-all ${
              isOnFire ? "border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]" : ""
            }`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-mono">{necRef}</span>
                  <button onClick={toggleBookmark} className="shrink-0">
                    <Bookmark className={`h-4 w-4 transition-colors ${
                      bookmarked.has(currentQuestion.id)
                        ? "fill-amber text-amber dark:fill-sparky-green dark:text-sparky-green"
                        : "text-muted-foreground hover:text-foreground"
                    }`} />
                  </button>
                </div>
                <p className="text-base font-medium text-foreground leading-relaxed">{currentQuestion.questionText}</p>
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
                  if (isCorrectAnswer) btnClass = "border-emerald bg-emerald/10 text-emerald dark:border-sparky-green dark:bg-sparky-green/10 dark:text-sparky-green";
                  else if (isSelected) btnClass = "border-red-500 bg-red-500/10 text-red-500";
                  else btnClass = "border-border dark:border-stone-800 text-muted-foreground opacity-60";
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-3 rounded-xl border transition-colors text-sm ${btnClass} ${!hasAnswered ? "cursor-pointer" : "cursor-default"}`}
                    whileTap={!hasAnswered ? { scale: 0.98 } : undefined}
                    animate={isSelected && !isCorrectAnswer && hasAnswered ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
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

            {/* Explanation + Sparky message */}
            {selectedAnswer !== null && (
              <motion.div
                ref={explanationRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                {/* Sparky feedback */}
                {sparkyMsg && (
                  <div className="mb-4">
                    <SparkyMessage size="small" message={sparkyMsg} />
                  </div>
                )}

                <Card className={`border ${correct ? "border-emerald/30 dark:border-sparky-green/20" : "border-red-500/20"} bg-card dark:bg-stone-900/50`}>
                  <CardContent className="p-4">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${correct ? "text-emerald dark:text-sparky-green" : "text-red-500"}`}>
                      {correct ? "Correct!" : "Incorrect"}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{explanation}</p>
                    {sparkyTip && (
                      <div className="flex items-start gap-2 pt-2 border-t border-border dark:border-stone-800">
                        <Zap className="h-3.5 w-3.5 text-amber dark:text-sparky-green shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground italic">{sparkyTip}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  ref={nextButtonRef}
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

      {/* Milestone banner overlay */}
      <AnimatePresence>
        {milestoneBanner !== null && <MilestoneBanner key={milestoneBanner} streak={milestoneBanner} />}
      </AnimatePresence>
    </motion.main>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    }>
      <QuizContent />
    </Suspense>
  );
}
