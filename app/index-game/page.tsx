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
  AlertTriangle,
  Timer,
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

  const MAX_WRONG = 3;
  const DIFFICULTY_TIME = { easy: 15, medium: 10, hard: 5 } as const;
  type Difficulty = keyof typeof DIFFICULTY_TIME;

  // Difficulty selection (null = show picker)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const questionTime = difficulty ? DIFFICULTY_TIME[difficulty] : 10;

  // Game state
  const [terms, setTerms] = useState<AnchoringTerm[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selected, setSelected] = useState<AnchorCategory | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showTrip, setShowTrip] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [tipText, setTipText] = useState("");
  const [reactionText, setReactionText] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<"complete" | "strikes" | "timeout">("complete");
  const [stats, setStats] = useState<GameStats>({ highScore: 0, totalPlayed: 0, totalCorrect: 0 });
  const [timeLeft, setTimeLeft] = useState<number>(questionTime);
  const [countdown, setCountdown] = useState<number | null>(null); // 3-2-1 before game starts
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load stats & clear any stale session
  useEffect(() => {
    setStats(loadStats());
    setTerms(shuffleTerms(ANCHORING_TERMS));
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (startCountdownRef.current) clearInterval(startCountdownRef.current);
    };
  }, []);

  // 3-2-1 countdown before game starts
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      return;
    }
    startCountdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (startCountdownRef.current) clearInterval(startCountdownRef.current);
          return prev === null ? null : 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (startCountdownRef.current) clearInterval(startCountdownRef.current);
    };
  }, [countdown !== null && countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentTerm = terms[currentIdx] as AnchoringTerm | undefined;
  const energizeLevel = getEnergizeLevel(streak);

  // End-game helper (shared by strikes, timeout, and natural completion)
  const endGame = useCallback(
    (reason: "complete" | "strikes" | "timeout", finalCorrect?: number) => {
      if (countdownRef.current) clearInterval(countdownRef.current);

      setGameOverReason(reason);
      setGameOver(true);
      const correct = finalCorrect ?? totalCorrect;
      const answered = currentIdx + (reason === "complete" ? 1 : 0);
      const newStats: GameStats = {
        highScore: Math.max(stats.highScore, score),
        totalPlayed: stats.totalPlayed + 1,
        totalCorrect: stats.totalCorrect + correct,
      };
      setStats(newStats);
      saveStats(newStats);
      const accuracy = answered > 0 ? (correct / answered) * 100 : 0;
      if (reason === "complete" && accuracy >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#F59E0B", "#A3FF00", "#10B981"],
        });
      }
      // Award watts
      const wattsEarned = correct * 12;
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
                  questionsAnswered: answered,
                  questionsCorrect: correct,
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
    },
    [totalCorrect, currentIdx, stats, score]
  );

  // Countdown timer — resets each question, pauses when answered or trip overlay showing
  useEffect(() => {
    if (gameOver || terms.length === 0 || showTrip || showTip || countdown !== null) return;
    if (selected !== null) {
      // Answered — stop countdown
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    setTimeLeft(questionTime);
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — count as wrong
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentIdx, gameOver, terms.length, selected, showTrip, showTip, questionTime, countdown]);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.7 },
      colors: ["#F59E0B", "#A3FF00", "#10B981"],
    });
  }, []);

  const advanceToNext = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (currentIdx + 1 >= terms.length) {
      endGame("complete");
    } else {
      setSelected(null);
      setIsCorrect(null);
      setShowTip(false);
      setTipText("");
      setReactionText("");
      setTimeLeft(questionTime);
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, terms.length, endGame, questionTime]);

  // Handle timeout — when timer hits 0 and no answer selected
  useEffect(() => {
    if (timeLeft === 0 && selected === null && !gameOver && terms.length > 0 && !showTrip && !showTip && countdown === null) {
      haptic("error");
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      setStreak(0);
      setSelected(currentTerm?.parent ?? null); // reveal correct answer
      setIsCorrect(false);
      setReactionText("Time\u2019s up!");

      if (newWrong >= MAX_WRONG) {
        advanceTimerRef.current = setTimeout(() => {
          endGame("strikes");
        }, 1200);
      } else {
        setShowTrip(true);
      }
    }
  }, [timeLeft, selected, gameOver, terms.length, showTrip, showTip, wrongCount, currentTerm, endGame, countdown]);

  const handleSelect = useCallback(
    (category: AnchorCategory) => {
      if (selected !== null || !currentTerm) return;
      if (countdownRef.current) clearInterval(countdownRef.current);

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
        const newWrong = wrongCount + 1;
        setWrongCount(newWrong);
        setStreak(0);
        setReactionText(TRIP_MESSAGES[Math.floor(Math.random() * TRIP_MESSAGES.length)]);

        if (newWrong >= MAX_WRONG) {
          // Show trip overlay, then end game after dismiss
          setShowTrip(true);
        } else {
          setShowTrip(true);
        }
      }
    },
    [selected, currentTerm, score, streak, totalCorrect, bestStreak, wrongCount, fireConfetti, advanceToNext]
  );

  const handleNewGame = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setTerms(shuffleTerms(ANCHORING_TERMS));
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    setWrongCount(0);
    setSelected(null);
    setIsCorrect(null);
    setShowTrip(false);
    setShowTip(false);
    setTipText("");
    setReactionText("");
    setGameOver(false);
    setGameOverReason("complete");
    setTimeLeft(questionTime);
    setCountdown(3);
  }, [questionTime]);

  const handleChangeDifficulty = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setTerms(shuffleTerms(ANCHORING_TERMS));
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    setWrongCount(0);
    setSelected(null);
    setIsCorrect(null);
    setShowTrip(false);
    setShowTip(false);
    setTipText("");
    setReactionText("");
    setGameOver(false);
    setGameOverReason("complete");
    setTimeLeft(10);
    setDifficulty(null);
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

  // Difficulty selection screen
  if (!difficulty) {
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <Target className="h-12 w-12 text-amber dark:text-sparky-green mx-auto mb-3" />
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              <span className="text-amber dark:text-sparky-green">Index</span> Anchoring
            </h1>
            <p className="text-muted-foreground text-sm">
              Match NEC field terms to their parent Index category. Choose your difficulty to begin.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            {(["easy", "medium", "hard"] as const).map((level, i) => {
              const config = {
                easy: {
                  label: "Easy",
                  time: "15 seconds",
                  desc: "Take your time to find the right category",
                  color: "text-emerald-500 dark:text-emerald-400",
                  border: "border-emerald-500/30 hover:border-emerald-500/60",
                  bg: "hover:bg-emerald-500/5",
                },
                medium: {
                  label: "Medium",
                  time: "10 seconds",
                  desc: "A solid pace for sharpening your index skills",
                  color: "text-amber dark:text-amber",
                  border: "border-amber/30 hover:border-amber/60",
                  bg: "hover:bg-amber/5",
                },
                hard: {
                  label: "Hard",
                  time: "5 seconds",
                  desc: "Lightning fast — for those who know the NEC cold",
                  color: "text-red-500 dark:text-red-400",
                  border: "border-red-500/30 hover:border-red-500/60",
                  bg: "hover:bg-red-500/5",
                },
              }[level];

              return (
                <motion.button
                  key={level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                  onClick={() => {
                    setDifficulty(level);
                    setTimeLeft(DIFFICULTY_TIME[level]);
                    setTerms(shuffleTerms(ANCHORING_TERMS));
                    setCountdown(3);
                  }}
                  className={`w-full text-left p-4 rounded-xl border ${config.border} ${config.bg} bg-card dark:bg-stone-900/50 transition-all cursor-pointer group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-lg font-bold ${config.color}`}>{config.label}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">{config.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm font-mono font-bold">{config.time}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {stats.totalPlayed > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center text-xs text-muted-foreground"
            >
              High score: {stats.highScore} · Games played: {stats.totalPlayed}
            </motion.div>
          )}
        </div>
      </main>
    );
  }

  // 3-2-1 countdown screen
  if (countdown !== null && countdown > 0) {
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
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center"
            >
              <span className="text-8xl font-black font-display text-amber dark:text-sparky-green drop-shadow-[0_0_24px_rgba(245,158,11,0.4)] dark:drop-shadow-[0_0_24px_rgba(163,255,0,0.4)]">
                {countdown}
              </span>
            </motion.div>
          </AnimatePresence>
          <p className="text-muted-foreground text-sm mt-6 capitalize">{difficulty} mode · {questionTime}s per question</p>
        </div>
      </main>
    );
  }

  // Game summary screen
  if (gameOver) {
    const answered = gameOverReason === "complete" ? terms.length : currentIdx + 1;
    const accuracy = answered > 0 ? Math.round((totalCorrect / answered) * 100) : 0;

    const summaryTitle =
      gameOverReason === "strikes"
        ? "Circuit Overload!"
        : "Game Complete!";

    const summarySubtitle =
      gameOverReason === "strikes"
        ? `The breaker tripped ${MAX_WRONG} times — circuit shut down after ${answered} terms`
        : `You\u2019ve worked through all ${terms.length} terms`;

    const sparkyMsg =
      gameOverReason === "strikes"
        ? "Too many trips! The breaker can only handle so much. Study the tips and try to keep the circuit running longer next time!"
        : accuracy >= 80
          ? "Amazing work! You really know your way around the NEC Index. Keep it up!"
          : accuracy >= 50
            ? "Good effort! Practice makes perfect — try again to improve your index navigation!"
            : "The NEC Index can be tricky. Review the tips and give it another shot — you'll get there!";

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
            {gameOverReason === "strikes" ? (
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            ) : (
              <Trophy className="h-16 w-16 text-amber dark:text-sparky-green mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">{summaryTitle}</h1>
            <p className="text-muted-foreground mb-8">{summarySubtitle}</p>
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

                {/* Strike indicators on game over */}
                {gameOverReason === "strikes" && (
                  <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-border dark:border-stone-800">
                    {Array.from({ length: MAX_WRONG }).map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full bg-red-500 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      />
                    ))}
                    <span className="text-xs text-red-500 font-medium ml-2">3 strikes</span>
                  </div>
                )}
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
            <Button
              variant="outline"
              onClick={handleChangeDifficulty}
              className="border-border dark:border-stone-700"
            >
              Change Difficulty
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <SparkyMessage size="medium" message={sparkyMsg} />
          </motion.div>
        </div>
      </main>
    );
  }

  const shouldShake = isCorrect === false && selected !== null;

  return (
    <motion.main
      animate={shouldShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      key={`shake-${wrongCount}`}
      className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10 flex flex-col">
        {/* Header — below answers on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 hidden md:block md:order-1"
        >
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
            <span className="text-amber dark:text-sparky-green">Index</span> Anchoring
          </h1>
          <p className="text-muted-foreground text-sm">
            Match each NEC field term to its parent Index category. Build streaks to energize!
          </p>
        </motion.div>

        {/* Score Bar — below answers on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 order-5 md:order-2"
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
                  {/* Timer */}
                  <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft <= 3 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}>
                    <Timer className="h-3.5 w-3.5" />
                    {timeLeft}s
                  </div>
                  {/* Strike indicators */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: MAX_WRONG }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          i < wrongCount
                            ? "bg-red-500"
                            : "bg-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
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
          className="mb-6 relative order-1 md:order-3"
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
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
                    {currentTerm?.term}
                  </p>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Correct flash — green glow + bolt overlay */}
          <AnimatePresence>
            {isCorrect === true && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 rounded-xl pointer-events-none"
              >
                {/* Green border glow */}
                <div className="absolute inset-0 rounded-xl ring-2 ring-emerald-500 dark:ring-sparky-green shadow-[0_0_20px_rgba(16,185,129,0.4)] dark:shadow-[0_0_20px_rgba(163,255,0,0.3)]" />
                {/* Bolt icon */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 dark:bg-sparky-green shadow-[0_0_12px_rgba(16,185,129,0.6)] dark:shadow-[0_0_12px_rgba(163,255,0,0.5)]"
                >
                  <Zap className="h-4 w-4 text-white dark:text-stone-950" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Category Button Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 order-2 md:order-4"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, scale: 0.97 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mb-6 order-first md:order-5"
            >
              <SparkyMessage size="medium" variant="thinking" message={tipText} />
              <div className="flex justify-center mt-4">
                <Button
                  onClick={advanceToNext}
                  className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                >
                  Continue
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
            strikeCount={wrongCount}
            maxStrikes={MAX_WRONG}
            onDismiss={() => {
              setShowTrip(false);
              if (wrongCount >= MAX_WRONG) {
                endGame("strikes");
              } else {
                setTipText(currentTerm.tip);
                setShowTip(true);
              }
            }}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function TripOverlay({
  term,
  tip,
  strikeCount,
  maxStrikes,
  onDismiss,
}: {
  term: string;
  tip: string;
  strikeCount: number;
  maxStrikes: number;
  onDismiss: () => void;
}) {
  const isFinalStrike = strikeCount >= maxStrikes;
  const [resetting, setResetting] = useState(false);

  const handleReset = () => {
    if (resetting) return;
    if (isFinalStrike) {
      // No reset animation — just dismiss
      haptic("error");
      onDismiss();
      return;
    }
    setResetting(true);
    haptic("medium");
    setTimeout(() => {
      haptic("success");
      onDismiss();
    }, 600);
  };

  // Smoke particles for final strike — staggered and looping
  const smokeParticles = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 60,
      drift: (Math.random() - 0.5) * 60,
      size: 24 + Math.random() * 36,
      delay: 0.4 + (i * 0.12) + Math.random() * 0.2,
      duration: 2.5 + Math.random() * 2,
      riseDistance: -100 - Math.random() * 100,
      opacity: 0.6 + Math.random() * 0.3,
    }))
  ).current;

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
        {/* ── Circuit Breaker Icon ── */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative mx-auto mb-5"
          style={{ width: 140, height: 200 }}
        >
          {/* Smoke particles — final strike only, looping */}
          {isFinalStrike && smokeParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 0, x: p.startX, scale: 0.2 }}
              animate={{
                opacity: [0, p.opacity, p.opacity * 0.6, 0],
                y: [0, p.riseDistance * 0.4, p.riseDistance * 0.7, p.riseDistance],
                x: [p.startX, p.startX + p.drift * 0.3, p.startX + p.drift * 0.7, p.startX + p.drift],
                scale: [0.2, 0.7, 1.1, 1.6],
              }}
              transition={{
                delay: p.delay,
                duration: p.duration,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 0.3 + Math.random() * 0.5,
              }}
              className="absolute left-1/2 top-[10%] -translate-x-1/2 rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(200,195,190,0.8), rgba(160,155,150,0.4) 40%, rgba(120,115,110,0.15) 70%, transparent)`,
                filter: "blur(6px)",
              }}
            />
          ))}

          <svg viewBox="0 0 140 200" fill="none" className="w-full h-full drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            {/* Main body — rounded rectangle */}
            <rect
              x="24" y="12" width="92" height="176" rx="6"
              className="fill-stone-200 dark:fill-stone-700 stroke-stone-400 dark:stroke-stone-500"
              strokeWidth="3"
            />

            {/* Side clips — left */}
            <rect x="14" y="40" width="14" height="20" rx="2"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500" strokeWidth="2.5" />
            <rect x="14" y="140" width="14" height="20" rx="2"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500" strokeWidth="2.5" />

            {/* Side clips — right */}
            <rect x="112" y="40" width="14" height="20" rx="2"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500" strokeWidth="2.5" />
            <rect x="112" y="140" width="14" height="20" rx="2"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500" strokeWidth="2.5" />

            {/* Terminal screws — two circles at top */}
            <circle cx="52" cy="42" r="10"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-500 dark:stroke-stone-400" strokeWidth="2.5" />
            <circle cx="52" cy="42" r="4"
              className="fill-stone-400 dark:fill-stone-500" />

            <circle cx="88" cy="42" r="10"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-500 dark:stroke-stone-400" strokeWidth="2.5" />
            <circle cx="88" cy="42" r="4"
              className="fill-stone-400 dark:fill-stone-500" />

            {/* Toggle housing — recessed area */}
            <rect x="42" y="70" width="56" height="80" rx="4"
              className="fill-stone-100 dark:fill-stone-800 stroke-stone-400 dark:stroke-stone-500" strokeWidth="2" />

            {/* Inner switch track */}
            <rect x="50" y="78" width="40" height="64" rx="3"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500" strokeWidth="1.5" />
          </svg>

          {/* Toggle handle — animated with Framer Motion (positioned over the SVG) */}
          <motion.div
            initial={{ y: 0 }}
            animate={resetting ? { y: 0 } : { y: 24 }}
            transition={
              resetting
                ? { duration: 0.15, ease: "easeIn" }
                : { delay: 0.35, duration: 0.12, ease: "easeIn" }
            }
            className="absolute"
            style={{ left: 52, top: 80, width: 36, height: 32 }}
          >
            <div className="w-full h-full rounded-sm bg-gradient-to-b from-stone-50 to-stone-200 dark:from-stone-400 dark:to-stone-500 border-2 border-stone-400 dark:border-stone-300 shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
              {/* Grip lines */}
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
                <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
                <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
              </div>
            </div>
          </motion.div>

          {/* TRIPPED label — over the breaker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={resetting ? { opacity: 0 } : { opacity: 1 }}
            transition={resetting ? { duration: 0.1 } : { delay: 0.55, duration: 0.3 }}
            className="absolute left-0 right-0 bottom-6 text-center"
          >
            <span className="text-[11px] font-black tracking-[0.2em] text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              TRIPPED
            </span>
          </motion.div>

          {/* Spark burst at trip moment */}
          {[...Array(6)].map((_, i) => {
            const angle = (i * 60) * (Math.PI / 180);
            const dist = 40 + Math.random() * 15;
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
                className="absolute left-1/2 top-[45%] w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber shadow-[0_0_6px_2px_rgba(245,158,11,0.8)]"
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
            className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-amber/30 blur-xl pointer-events-none"
          />
        </motion.div>

        {/* Strike indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-1.5 mb-3"
        >
          {Array.from({ length: maxStrikes }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${
                i < strikeCount
                  ? "bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  : "bg-transparent border-white/30"
              }`}
            />
          ))}
        </motion.div>

        {isFinalStrike && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-red-400 text-sm font-bold mb-2"
          >
            Breaker tripped too many times!
          </motion.p>
        )}

        {/* Text below breaker */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isFinalStrike ? 0.85 : 0.7 }}
          className="text-white/80 text-sm mb-1 font-medium"
        >
          &ldquo;{term}&rdquo;
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isFinalStrike ? 1.0 : 0.85 }}
          className="text-white/55 text-xs leading-relaxed mb-4"
        >
          {tip}
        </motion.p>

        {/* RESET button — outside the breaker icon */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isFinalStrike ? 1.2 : 0.9 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center justify-center px-8 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default backdrop-blur-sm"
        >
          {isFinalStrike ? "GAME OVER" : "RESET BREAKER"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
