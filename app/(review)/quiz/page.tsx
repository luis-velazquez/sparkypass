"use client";

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Star,
  StarOff,
  ArrowRight,
  Loader2,
  Zap,
  Calculator,
  Ban,
  Layers,
  Flame,
  Book,
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
import { QuestionCard } from "@/components/quiz-engine";
import {
  CORRECT_MESSAGES,
  INCORRECT_MESSAGES,
  ON_FIRE_MESSAGES,
  STREAK_BROKEN_MESSAGES,
  STREAK_THRESHOLD,
  getRandomMessage,
} from "@/components/quiz-engine/sparky-messages";
import { getRandomQuestionsAll } from "@/lib/questions";
import { useNecVersion, getNecReference, getExplanation, getSparkyTip } from "@/lib/nec-version";
import { ReviewPageShell, ReviewLoadingState, ReviewGridBackground } from "../shared";
import type { Question, Difficulty } from "@/types/question";

const QUESTION_COUNTS = [10, 20, 30] as const;

type QuestionType = "calculations" | "non-calculations" | "both";

// ─── Confetti ───────────────────────────────────────────────────────────────

function fireQuizConfetti(level: number = 0) {
  haptic("celebration");
  const colors = ["#F59E0B", "#10B981", "#8B5CF6", "#FFFBEB", "#A3FF00"];
  const sideCount = level >= 4 ? 200 : level >= 3 ? 180 : level >= 2 ? 150 : level >= 1 ? 120 : 80;
  confetti({ particleCount: sideCount, spread: 55, origin: { x: 0, y: 0.7 }, colors });
  confetti({ particleCount: sideCount, spread: 55, origin: { x: 1, y: 0.7 }, colors });
  if (level >= 2) confetti({ particleCount: level >= 3 ? 120 : 80, spread: 100, origin: { x: 0.5, y: 0 }, colors, gravity: 1.2 });
  if (level === 3) setTimeout(() => { confetti({ particleCount: 120, spread: 70, origin: { x: 0.3, y: 0.5 }, colors }); confetti({ particleCount: 120, spread: 70, origin: { x: 0.7, y: 0.5 }, colors }); }, 300);
  if (level >= 4) [500, 1000, 1500, 2000].forEach((d) => setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { x: Math.random(), y: Math.random() * 0.4 }, colors }), d));
}

// ─── Particle Burst ─────────────────────────────────────────────────────────

function LightningStrike({ x, y, id }: { x: number; y: number; id: number }) {
  // Generate a jagged lightning path from top of screen to the target point
  const path = useMemo(() => {
    const segments: { x: number; y: number }[] = [];
    const steps = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const jitter = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 60;
      segments.push({ x: jitter, y: -y * (1 - progress) });
    }
    return segments;
  }, [y]);

  const pathD = `M ${path[0].x} ${path[0].y} ${path.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")}`;

  return (
    <div key={id} className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
      {/* Main bolt */}
      <motion.svg
        width="120" height={y + 20} viewBox={`-60 ${-y} 120 ${y + 20}`}
        className="absolute" style={{ left: -60, top: -y }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.8, 1, 0] }}
        transition={{ duration: 0.6, times: [0, 0.05, 0.1, 0.15, 0.2, 1] }}
      >
        <motion.path
          d={pathD}
          stroke="#F59E0B"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          filter="url(#bolt-glow)"
        />
        <motion.path
          d={pathD}
          stroke="#FFFBEB"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
        <defs>
          <filter id="bolt-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </motion.svg>

      {/* Impact flash */}
      <motion.div
        className="absolute rounded-full"
        style={{ left: -30, top: -30, width: 60, height: 60 }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 2.5, 0], opacity: [1, 0.6, 0] }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="w-full h-full rounded-full bg-amber/40 dark:bg-sparky-green/40 blur-xl" />
      </motion.div>

      {/* Small sparks at impact */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 25 + Math.random() * 20;
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber dark:bg-sparky-green"
            style={{ left: -3, top: -3, boxShadow: "0 0 6px 2px rgba(245,158,11,0.6)" }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

// ─── Milestone Banner ───────────────────────────────────────────────────────

function MilestoneBanner({ streak }: { streak: number }) {
  const config = streak >= 20
    ? { text: "GODLIKE!", gradient: "from-yellow-400 via-amber to-orange-500", size: "text-4xl md:text-6xl", sub: "Absolute perfection!" }
    : streak >= 15 ? { text: "LEGENDARY!", gradient: "from-red-500 via-orange-500 to-yellow-400", size: "text-3xl md:text-5xl", sub: "Unbelievable streak!" }
    : streak >= 10 ? { text: "UNSTOPPABLE!", gradient: "from-orange-500 via-red-500 to-orange-500", size: "text-3xl md:text-5xl", sub: "You're on another level!" }
    : { text: "ON FIRE!", gradient: "from-orange-400 to-red-500", size: "text-2xl md:text-4xl", sub: "Keep it going!" };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: [0.3, 1.05, 1] }} exit={{ opacity: 0, scale: 1.3, y: -30 }}
      transition={{ duration: 0.6, scale: { type: "tween", duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } }}
      className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30" />
      <div className="relative flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <motion.span animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.3 }}>
            <Flame className={`${streak >= 15 ? "h-10 w-10" : "h-8 w-8"} text-orange-500`} />
          </motion.span>
          <motion.p animate={streak >= 15 ? { scale: [1, 1.02, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
            className={`${config.size} font-black bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent drop-shadow-lg`}>
            {config.text} {streak}!
          </motion.p>
          <motion.span animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.3 }}>
            <Flame className={`${streak >= 15 ? "h-10 w-10" : "h-8 w-8"} text-orange-500`} />
          </motion.span>
        </div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-white/80 text-sm md:text-base font-medium">{config.sub}</motion.p>
      </div>
    </motion.div>
  );
}

// ─── Config ─────────────────────────────────────────────────────────────────

const MILESTONES = [5, 10, 15, 20];

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
  const { status: authStatus } = useSession();
  const router = useRouter();
  const { necVersion } = useNecVersion();

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [bestStreak, setBestStreak] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [sparkyMessage, setSparkyMessage] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [streakBroken, setStreakBroken] = useState(false);
  const [milestoneBanner, setMilestoneBanner] = useState<number | null>(null);
  const [lightningStrike, setLightningStrike] = useState<{ x: number; y: number; id: number } | null>(null);

  const feedbackRef = useRef<HTMLDivElement>(null);
  const answerButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  const startQuiz = useCallback((count: number) => {
    let pool = getRandomQuestionsAll(9999, necVersion).filter((q) => q.difficulty === difficulty);
    if (questionType === "calculations") pool = pool.filter((q) => q.calculation);
    else if (questionType === "non-calculations") pool = pool.filter((q) => !q.calculation);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, Math.min(count, shuffled.length)));
    setQuestionCount(count);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setAnswers(new Map());
    setBookmarked(new Set());
    setBestStreak(0);
    setCorrectStreak(0);
    setSparkyMessage("");
    setShowHint(false);
    setStreakBroken(false);
  }, [necVersion, difficulty, questionType]);

  const currentQuestion = questions[currentIdx];
  const isOnFire = correctStreak >= STREAK_THRESHOLD;
  const isLastQuestion = currentIdx + 1 >= questions.length;
  const isCorrectAnswer = currentQuestion ? selectedAnswer === currentQuestion.correctAnswer : false;
  const progressPercentage = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    if (isSubmitted) return;
    haptic("tap");
    setSelectedAnswer(answerIndex);

    // Auto-submit
    if (!currentQuestion) return;
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    haptic(isCorrect ? "success" : "error");
    setIsSubmitted(true);
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, answerIndex));

    const newStreak = isCorrect ? correctStreak + 1 : 0;
    const justHitStreak = isCorrect && newStreak >= STREAK_THRESHOLD && correctStreak < STREAK_THRESHOLD;
    const wasOnFire = correctStreak >= STREAK_THRESHOLD;
    const streakJustBroken = !isCorrect && wasOnFire;

    // Sparky message
    let message: string;
    if (streakJustBroken) message = getRandomMessage(STREAK_BROKEN_MESSAGES);
    else if (justHitStreak) message = getRandomMessage(ON_FIRE_MESSAGES);
    else if (isCorrect && newStreak >= STREAK_THRESHOLD) message = `🔥 ${newStreak} in a row! ${getRandomMessage(CORRECT_MESSAGES)}`;
    else if (isCorrect) message = getRandomMessage(CORRECT_MESSAGES);
    else message = getRandomMessage(INCORRECT_MESSAGES);

    setCorrectStreak(newStreak);
    setBestStreak((prev) => Math.max(prev, newStreak));
    setSparkyMessage(message);
    setStreakBroken(streakJustBroken);
    setShowHint(false);

    // Celebrations
    if (isCorrect) {
      // Particle burst during streak
      if (newStreak >= STREAK_THRESHOLD) {
        const btn = answerButtonRefs.current[answerIndex];
        if (btn) {
          const rect = btn.getBoundingClientRect();
          setLightningStrike({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, id: Date.now() });
          setTimeout(() => setLightningStrike(null), 800);
        }
      }
      // Confetti
      const isMilestone = MILESTONES.includes(newStreak);
      const confettiLevel = isMilestone ? (newStreak >= 20 ? 4 : newStreak >= 15 ? 3 : newStreak >= 10 ? 2 : 1) : 0;
      fireQuizConfetti(confettiLevel);
      // Milestone banner
      if (isMilestone) {
        setMilestoneBanner(newStreak);
        setTimeout(() => setMilestoneBanner(null), 2500);
      }
    }

    setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  }, [isSubmitted, currentQuestion, correctStreak]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
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
      setIsSubmitted(false);
      setSparkyMessage("");
      setStreakBroken(false);
      setShowHint(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isLastQuestion, questions, answers, bookmarked, bestStreak, difficulty, router]);

  const handleToggleBookmark = useCallback(() => {
    if (!currentQuestion) return;
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  }, [currentQuestion]);

  const handleExit = useCallback(() => { router.push("/dashboard"); }, [router]);

  const isBookmarked = currentQuestion ? bookmarked.has(currentQuestion.id) : false;
  const explanation = currentQuestion ? getExplanation(currentQuestion, necVersion) : "";
  const sparkyTip = currentQuestion ? getSparkyTip(currentQuestion, necVersion) : "";
  const shakeAnimation = streakBroken ? { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.5 } } : {};

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
                      <div className="w-9 h-9 rounded-lg bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center shrink-0"><Icon className="h-4.5 w-4.5 text-amber dark:text-sparky-green" /></div>
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
            <button onClick={() => setDifficulty(null)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 cursor-pointer"><ChevronLeft className="h-3 w-3 inline mr-1" />Back to difficulty</button>
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
            <p className="text-muted-foreground text-sm">{questionType === "calculations" ? "Calculations only" : questionType === "non-calculations" ? "Knowledge questions only" : "All question types"}</p>
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
            <button onClick={() => setQuestionType(null)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 cursor-pointer"><ChevronLeft className="h-3 w-3 inline mr-1" />Back to question type</button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!currentQuestion) {
    return <ReviewLoadingState />;
  }

  // ─── Quiz Playing (Daily Challenge Style) ──────────────────────────────────
  const diffLabel = difficulty === "journeyman" ? "Journeyman" : "Master";

  return (
    <>
      {/* Particle burst */}
      {lightningStrike && <LightningStrike key={lightningStrike.id} x={lightningStrike.x} y={lightningStrike.y} id={lightningStrike.id} />}

      <motion.main className="relative min-h-screen bg-cream dark:bg-stone-950" animate={shakeAnimation}>
        <ReviewGridBackground />
        <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
          {/* Desktop progress bar */}
          <div className="hidden md:block mb-6">
            <div className={`h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden transition-shadow duration-500 ${isOnFire ? "shadow-[0_0_12px_3px_rgba(249,115,22,0.6)]" : ""}`}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 0.3, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${isOnFire ? "bg-gradient-to-r from-orange-500 via-amber to-red-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" : "bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark"}`} />
            </div>
          </div>

          {/* Desktop nav bar */}
          <div className="hidden md:flex items-center justify-between gap-3 mb-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="default" className="gap-2"><ChevronLeft className="h-4 w-4" />Exit</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
                  <AlertDialogDescription>Your progress will not be saved.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExit}>Exit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{currentIdx + 1} / {questions.length}</span>
              {correctStreak >= STREAK_THRESHOLD && (
                <motion.span key={correctStreak} initial={{ opacity: 0, scale: 0.5, rotate: -15 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5 }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-bold border bg-gradient-to-r from-orange-500/15 to-red-500/15 text-orange-500 border-orange-500/25">
                  <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }}><Flame className="h-3 w-3" /></motion.span>
                  {correctStreak}
                </motion.span>
              )}
              <span className="text-xs text-muted-foreground">{diffLabel} Quiz</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="default" onClick={handleToggleBookmark} className={`gap-2 ${isBookmarked ? "text-amber border-amber" : ""}`}>
                {isBookmarked ? <Star className="h-4 w-4 fill-amber" /> : <StarOff className="h-4 w-4" />}
                {isBookmarked ? "Saved" : "Save"}
              </Button>
              {isSubmitted && (
                <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Button onClick={handleNext} size="default" className="bg-amber hover:bg-amber/90 text-white gap-2 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                    {isLastQuestion ? "See Results" : "Next"}<ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitted={isSubmitted}
            onSelectAnswer={handleSelectAnswer}
            necVersion={necVersion}
            answerButtonRefs={answerButtonRefs}
            showHint={showHint}
            onToggleHint={() => setShowHint((prev) => !prev)}
          />

          {/* Mobile Next Button */}
          {isSubmitted && (
            <div className="flex justify-center mb-6 md:hidden">
              <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="w-full">
                <Button onClick={handleNext} size="lg" className="bg-amber hover:bg-amber/90 text-white gap-2 w-full dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                  {isLastQuestion ? "See Results" : "Next Question"}<ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          )}

          {/* Desktop Next Button */}
          {isSubmitted && (
            <div className="hidden md:flex justify-end mb-6">
              <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <Button onClick={handleNext} size="default" className="bg-amber hover:bg-amber/90 text-white gap-2 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                  {isLastQuestion ? "See Results" : "Next"}<ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          )}

          {/* Mobile progress + nav */}
          <div className="md:hidden mb-4">
            <div className={`h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden transition-shadow duration-500 mb-3 ${isOnFire ? "shadow-[0_0_12px_3px_rgba(249,115,22,0.6)]" : ""}`}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 0.3, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${isOnFire ? "bg-gradient-to-r from-orange-500 via-amber to-red-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" : "bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark"}`} />
            </div>
            <div className="flex items-center justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9"><ChevronLeft className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
                    <AlertDialogDescription>Your progress will not be saved.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continue</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExit}>Exit</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{currentIdx + 1} / {questions.length}</span>
                {correctStreak >= STREAK_THRESHOLD && (
                  <motion.span key={correctStreak} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-bold bg-gradient-to-r from-orange-500/15 to-red-500/15 text-orange-500 border border-orange-500/25">
                    <Flame className="h-3 w-3" />{correctStreak}
                  </motion.span>
                )}
                <span className="text-xs text-muted-foreground">{diffLabel}</span>
              </div>
              <Button variant="outline" size="icon" onClick={handleToggleBookmark} className={`h-9 w-9 ${isBookmarked ? "text-amber border-amber" : ""}`}>
                {isBookmarked ? <Star className="h-4 w-4 fill-amber" /> : <StarOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Feedback Section */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div ref={feedbackRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="mb-6">
                {/* Streak badge */}
                <div className="flex justify-center gap-3 mb-4 flex-wrap">
                  {isCorrectAnswer && (
                    <motion.span initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/20 text-emerald dark:bg-sparky-green/20 dark:text-sparky-green rounded-full text-lg font-bold">
                      <CheckCircle2 className="h-5 w-5" />Correct!
                    </motion.span>
                  )}
                  {correctStreak >= STREAK_THRESHOLD && (
                    <motion.span key={`feedback-streak-${correctStreak}`} initial={{ opacity: 0, scale: 0, rotate: -180 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full font-bold border bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-500 border-orange-500/30">
                      <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }}><Flame className="h-5 w-5" /></motion.span>
                      {correctStreak} Streak!
                    </motion.span>
                  )}
                </div>

                {/* Sparky + Explanation */}
                <Card className={`${isCorrectAnswer ? "border-emerald/50 dark:border-sparky-green/50" : "border-amber/50"}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      {isCorrectAnswer ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald/20 text-emerald dark:bg-sparky-green/20 dark:text-sparky-green text-sm font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />Correct!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm font-medium">
                          <XCircle className="h-3.5 w-3.5" />Not Quite
                        </span>
                      )}
                    </div>

                    <SparkyMessage message={sparkyMessage} size="medium" variant={isCorrectAnswer ? "default" : "calm"} className="mb-4" />

                    <div className="mt-4 p-4 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Book className="h-4 w-4 text-purple" />Explanation
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">{explanation}</p>
                      {sparkyTip && (
                        <div className="flex items-start gap-2 pt-2 border-t border-border dark:border-stone-800">
                          <Zap className="h-3.5 w-3.5 text-amber dark:text-sparky-green shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground italic">{sparkyTip}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Milestone banner */}
      <AnimatePresence>
        {milestoneBanner !== null && <MilestoneBanner key={milestoneBanner} streak={milestoneBanner} />}
      </AnimatePresence>
    </>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<ReviewLoadingState />}>
      <QuizContent />
    </Suspense>
  );
}
