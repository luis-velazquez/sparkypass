"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Flame,
  Trophy,
  Zap,
  RotateCcw,
  ChevronRight,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { haptic } from "@/lib/haptics";
import confetti from "canvas-confetti";
import {
  ANCHOR_CATEGORIES,
  ANCHORING_TERMS,
  shuffleTerms,
  getEnergizeLevel,
  CORRECT_REACTIONS,
  TRIP_MESSAGES,
  type AnchoringTerm,
  type AnchorCategory,
} from "./anchoring-data";

const STORAGE_KEY = "sparkypass-index-game";

interface GameStats {
  highScore: number;
  totalPlayed: number;
  totalCorrect: number;
}

function loadStats(): GameStats {
  if (typeof window === "undefined") return { highScore: 0, totalPlayed: 0, totalCorrect: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GameStats;
  } catch {}
  return { highScore: 0, totalPlayed: 0, totalCorrect: 0 };
}

function saveStats(stats: GameStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

function getEnergizeStyles(level: number): string {
  switch (level) {
    case 1:
      return "border-amber/50 shadow-glow-primary";
    case 2:
      return "border-sparky-green/50 shadow-glow-sparky";
    case 3:
      return "border-sparky-green/50 shadow-glow-sparky animate-sparky-pulse";
    case 4:
      return "border-sparky-green/50 shadow-glow-sparky animate-sparky-pulse ring-2 ring-sparky-green/30";
    default:
      return "border-border dark:border-stone-800";
  }
}

export default function IndexGamePage() {
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
      <IndexGameContent />
    </Suspense>
  );
}

function IndexGameContent() {
  const { status } = useSession();
  const router = useRouter();

  // Game state
  const [terms, setTerms] = useState<AnchoringTerm[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [selected, setSelected] = useState<AnchorCategory | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showTrip, setShowTrip] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [tipText, setTipText] = useState("");
  const [reactionText, setReactionText] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState<GameStats>({ highScore: 0, totalPlayed: 0, totalCorrect: 0 });
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load stats & init game
  useEffect(() => {
    setStats(loadStats());
    setTerms(shuffleTerms(ANCHORING_TERMS));
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const currentTerm = terms[currentIdx] as AnchoringTerm | undefined;
  const energizeLevel = getEnergizeLevel(streak);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.7 },
      colors: ["#F59E0B", "#A3FF00", "#10B981"],
    });
  }, []);

  const advanceToNext = useCallback(() => {
    if (currentIdx + 1 >= terms.length) {
      // Game over
      setGameOver(true);
      const newStats: GameStats = {
        highScore: Math.max(stats.highScore, score),
        totalPlayed: stats.totalPlayed + 1,
        totalCorrect: stats.totalCorrect + totalCorrect,
      };
      setStats(newStats);
      saveStats(newStats);
      const accuracy = terms.length > 0 ? (totalCorrect / terms.length) * 100 : 0;
      if (accuracy >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#F59E0B", "#A3FF00", "#10B981"],
        });
      }

      // Award watts: 12W per correct answer
      const wattsEarned = totalCorrect * 12;
      if (wattsEarned > 0) {
        (async () => {
          try {
            const sessionRes = await fetch("/api/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionType: "quiz" }),
            });
            if (sessionRes.ok) {
              const { sessionId } = await sessionRes.json();
              const patchRes = await fetch("/api/sessions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId,
                  wattsEarned,
                  activityType: "index_game",
                  questionsAnswered: terms.length,
                  questionsCorrect: totalCorrect,
                }),
              });
              if (patchRes.ok) {
                const data = await patchRes.json();
                if (typeof data.wattsBalance === "number") {
                  window.dispatchEvent(new CustomEvent("watts-updated", { detail: data.wattsBalance }));
                }
              }
            }
          } catch {
            // Silently fail
          }
        })();
      }
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelected(null);
      setIsCorrect(null);
      setShowTip(false);
      setTipText("");
      setReactionText("");
    }
  }, [currentIdx, terms.length, stats, score, totalCorrect]);

  const handleSelect = useCallback(
    (category: AnchorCategory) => {
      if (selected !== null || !currentTerm) return;

      setSelected(category);
      const correct = category === currentTerm.parent;
      setIsCorrect(correct);

      if (correct) {
        haptic("success");
        const newScore = score + 1;
        const newStreak = streak + 1;
        const newTotalCorrect = totalCorrect + 1;
        setScore(newScore);
        setStreak(newStreak);
        setTotalCorrect(newTotalCorrect);
        if (newStreak > bestStreak) setBestStreak(newStreak);
        setReactionText(CORRECT_REACTIONS[Math.floor(Math.random() * CORRECT_REACTIONS.length)]);

        // Confetti burst every 5th streak
        if (newStreak > 0 && newStreak % 5 === 0) {
          fireConfetti();
        }

        // Auto-advance after 800ms
        advanceTimerRef.current = setTimeout(() => {
          advanceToNext();
        }, 800);
      } else {
        haptic("error");
        setStreak(0);
        setReactionText(TRIP_MESSAGES[Math.floor(Math.random() * TRIP_MESSAGES.length)]);
        setShowTrip(true);
      }
    },
    [selected, currentTerm, score, streak, totalCorrect, bestStreak, fireConfetti, advanceToNext]
  );

  const handleNewGame = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setTerms(shuffleTerms(ANCHORING_TERMS));
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    setSelected(null);
    setIsCorrect(null);
    setShowTrip(false);
    setShowTip(false);
    setTipText("");
    setReactionText("");
    setGameOver(false);
  }, []);

  if (status === "loading") {
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

  // Game summary screen
  if (gameOver) {
    const accuracy = terms.length > 0 ? Math.round((totalCorrect / terms.length) * 100) : 0;
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
        <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Trophy className="h-16 w-16 text-amber dark:text-sparky-green mx-auto mb-4" />
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">Game Complete!</h1>
            <p className="text-muted-foreground mb-8">
              You&apos;ve worked through all {terms.length} terms
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800 mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-amber dark:text-sparky-green">{score}</p>
                    <p className="text-sm text-muted-foreground">Score</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-emerald dark:text-sparky-green">
                      {accuracy}%
                    </p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-amber dark:text-sparky-green">
                      {bestStreak}
                    </p>
                    <p className="text-sm text-muted-foreground">Best Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center gap-3"
          >
            <Button
              onClick={handleNewGame}
              className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <SparkyMessage
              size="medium"
              message={
                accuracy >= 80
                  ? "Amazing work! You really know your way around the NEC Index. Keep it up!"
                  : accuracy >= 50
                    ? "Good effort! Practice makes perfect — try again to improve your index navigation!"
                    : "The NEC Index can be tricky. Review the tips and give it another shot — you'll get there!"
              }
            />
          </motion.div>
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
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
            <span className="text-amber dark:text-sparky-green">Index</span> Anchoring
          </h1>
          <p className="text-muted-foreground text-sm">
            Match each NEC field term to its parent Index category. Build streaks to energize!
          </p>
        </motion.div>

        {/* Score Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber dark:text-sparky-green">{score}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground flex items-center gap-1">
                      {streak}
                      {streak >= 3 && (
                        <Flame className="h-4 w-4 text-orange-500 inline" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-muted-foreground">{stats.highScore}</p>
                    <p className="text-xs text-muted-foreground">Best</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {currentIdx + 1}/{terms.length}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleNewGame} className="border-border dark:border-stone-700">
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    New Game
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Field Term Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <Card
            className={`bg-card dark:bg-stone-900/50 transition-all duration-300 ${getEnergizeStyles(energizeLevel)}`}
          >
            <CardContent className="p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Field Term
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
                    {currentTerm?.term}
                  </p>
                </motion.div>
              </AnimatePresence>
              {reactionText && isCorrect !== null && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm mt-2 font-medium ${
                    isCorrect ? "text-emerald dark:text-sparky-green" : "text-red-500"
                  }`}
                >
                  {reactionText}
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Button Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ANCHOR_CATEGORIES.map((cat) => {
              const isSelected = selected === cat;
              const isAnswer = currentTerm?.parent === cat;
              let btnClass =
                "border-border dark:border-stone-700 text-foreground hover:bg-muted";

              if (selected !== null) {
                if (isAnswer) {
                  btnClass =
                    "border-emerald bg-emerald/10 text-emerald dark:border-sparky-green dark:bg-sparky-green/10 dark:text-sparky-green font-medium";
                } else if (isSelected && !isCorrect) {
                  btnClass =
                    "border-red-500 bg-red-500/10 text-red-500 font-medium";
                }
              }

              return (
                <motion.div
                  key={cat}
                  animate={
                    isSelected && !isCorrect
                      ? { x: [0, -4, 4, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <Button
                    variant="outline"
                    className={`w-full min-h-[44px] text-xs sm:text-sm transition-colors ${btnClass}`}
                    disabled={selected !== null}
                    onClick={() => handleSelect(cat)}
                  >
                    {cat}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Sparky Tip (after wrong answer, trip dismissed) */}
        <AnimatePresence>
          {showTip && tipText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <SparkyMessage size="medium" variant="thinking" message={tipText} />
              <div className="flex justify-center mt-4">
                <Button
                  onClick={advanceToNext}
                  className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trip Overlay */}
      <AnimatePresence>
        {showTrip && currentTerm && (
          <TripOverlay
            term={currentTerm.term}
            tip={currentTerm.tip}
            onDismiss={() => {
              setShowTrip(false);
              setTipText(currentTerm.tip);
              setShowTip(true);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function TripOverlay({
  term,
  tip,
  onDismiss,
}: {
  term: string;
  tip: string;
  onDismiss: () => void;
}) {
  const [resetting, setResetting] = useState(false);

  const handleReset = () => {
    if (resetting) return;
    setResetting(true);
    haptic("medium");
    // Let the reset animation play, then dismiss
    setTimeout(() => {
      haptic("success");
      onDismiss();
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      {/* Red flash */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1, 0, 0.5, 0] }}
        transition={{ duration: 0.8, times: [0, 0.1, 0.2, 0.3, 0.5, 0.8] }}
        className="fixed inset-0 bg-red-500/25 pointer-events-none"
      />

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", bounce: 0.35 }}
        className="text-center p-6 max-w-xs"
      >
        {/* ── GFCI Breaker Body ── */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative mx-auto w-36 rounded-lg bg-gradient-to-b from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800 border border-stone-400 dark:border-stone-500 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden mb-5"
        >
          {/* Top screw */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-stone-400 to-stone-500 dark:from-stone-500 dark:to-stone-600 border border-stone-500 dark:border-stone-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
              <div className="w-full h-0.5 bg-stone-600/60 dark:bg-stone-400/60 mt-[7px] rounded-full" />
            </div>
          </div>

          {/* Toggle switch area */}
          <div className="px-5 pt-2 pb-1">
            {/* ON / OFF labels */}
            <div className="flex justify-between text-[9px] font-bold tracking-wider text-stone-500 dark:text-stone-400 mb-1 px-1">
              <span>ON</span>
              <span>OFF</span>
            </div>
            {/* Switch track */}
            <div className="relative h-8 rounded bg-stone-800 dark:bg-stone-900 border border-stone-600 dark:border-stone-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Switch handle — animates from ON (left) to middle (tripped) */}
              <motion.div
                initial={{ x: 0 }}
                animate={resetting ? { x: 0 } : { x: "50%" }}
                transition={
                  resetting
                    ? { duration: 0.15, ease: "easeIn" }
                    : { delay: 0.35, duration: 0.12, ease: "easeIn" }
                }
                className="absolute top-0.5 bottom-0.5 left-0.5 w-[45%] rounded-sm bg-gradient-to-b from-stone-100 to-stone-300 dark:from-stone-400 dark:to-stone-500 border border-stone-400 dark:border-stone-300 shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
              >
                {/* Grip lines */}
                <div className="flex flex-col items-center justify-center h-full gap-1">
                  <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
                  <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
                  <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* TRIPPED label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={resetting ? { opacity: 0 } : { opacity: 1 }}
            transition={resetting ? { duration: 0.1 } : { delay: 0.55, duration: 0.3 }}
            className="text-center py-1.5"
          >
            <span className="text-[10px] font-black tracking-[0.2em] text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              TRIPPED
            </span>
          </motion.div>

          {/* Red indicator window */}
          <div className="flex justify-center pb-3">
            <div className="relative w-8 h-8 rounded-sm bg-stone-800 dark:bg-stone-900 border border-stone-500 dark:border-stone-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Red indicator — appears on trip, disappears on reset */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={
                  resetting
                    ? { opacity: 0, scale: 0 }
                    : { opacity: 1, scale: 1 }
                }
                transition={
                  resetting
                    ? { duration: 0.15 }
                    : { delay: 0.5, duration: 0.2, type: "spring", bounce: 0.5 }
                }
                className="absolute inset-1 rounded-sm bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7),inset_0_1px_0_rgba(255,255,255,0.3)]"
              />
            </div>
          </div>

          {/* Divider line */}
          <div className="mx-4 h-px bg-stone-400/50 dark:bg-stone-500/50" />

          {/* RESET button — the interactive part */}
          <div className="px-5 py-3">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleReset}
              disabled={resetting}
              className="w-full h-10 rounded bg-gradient-to-b from-stone-100 to-stone-200 dark:from-stone-500 dark:to-stone-600 border border-stone-400 dark:border-stone-300 shadow-[0_2px_6px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:from-stone-50 hover:to-stone-150 dark:hover:from-stone-400 dark:hover:to-stone-500 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all cursor-pointer disabled:cursor-default"
            >
              <span className="text-xs font-black tracking-[0.15em] text-stone-700 dark:text-stone-200">
                RESET
              </span>
            </motion.button>
          </div>

          {/* Bottom screw */}
          <div className="flex justify-center pb-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-stone-400 to-stone-500 dark:from-stone-500 dark:to-stone-600 border border-stone-500 dark:border-stone-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
              <div className="w-full h-0.5 bg-stone-600/60 dark:bg-stone-400/60 mt-[7px] rounded-full" />
            </div>
          </div>

          {/* Spark burst at trip moment */}
          {[...Array(6)].map((_, i) => {
            const angle = (i * 60) * (Math.PI / 180);
            const dist = 35 + Math.random() * 15;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 0.8, 0],
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                }}
                transition={{
                  delay: 0.38,
                  duration: 0.5,
                  times: [0, 0.2, 0.6, 1],
                }}
                className="absolute left-1/2 top-1/3 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber shadow-[0_0_6px_2px_rgba(245,158,11,0.8)]"
              />
            );
          })}

          {/* Arc flash glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.7, 0.3, 0],
              scale: [0.5, 1.3, 1.1, 0.8],
            }}
            transition={{ delay: 0.36, duration: 0.7 }}
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-amber/30 blur-xl pointer-events-none"
          />
        </motion.div>

        {/* Text below breaker */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/80 text-sm mb-1 font-medium"
        >
          &ldquo;{term}&rdquo;
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="text-white/55 text-xs leading-relaxed"
        >
          {tip}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
