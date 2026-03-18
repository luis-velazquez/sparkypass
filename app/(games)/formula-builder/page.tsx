"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, Reorder } from "framer-motion";
import { Workflow, AlertTriangle, Check, GripVertical, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptics";

import {
  type GameStats,
  type DifficultyConfig,
  loadStats,
  BlueprintBackground,
  GameLoadingFallback,
  GameOverScreen,
  SkipButton,
  MAX_SKIPS,
  DifficultyPicker,
  ScoreBar,
  GameHeader,
  QuestionCard,
  fireStreakConfetti,
  finalizeGame,
  CONTINUE_COST,
  WATTS_PER_CORRECT,
  getComboMultiplier,
  checkWildcardEarned,
  WildcardBar,
  WildcardEarnedToast,
  type WildcardType,
  type WildcardInventory,
} from "../shared";

import type { GameId } from "@/lib/game-packs";

import {
  type FormulaScenario,
  type FormulaStep,
  shuffleSteps,
  getEnergizeLevel,
  SCENARIOS,
  getUnlockedScenarios,
} from "./builder-data";

const GAME_ID: GameId = "formula-builder";
const STORAGE_KEY = "sparkypass-formula-builder";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FormulaBuilderPage() {
  return (
    <Suspense fallback={<GameLoadingFallback />}>
      <FormulaBuilderContent />
    </Suspense>
  );
}

function FormulaBuilderContent() {
  const { status } = useSession();
  const router = useRouter();

  const MAX_WRONG = 3;
  const DIFFICULTY_TIME = { easy: 45, medium: 35, hard: 25 } as const;
  type Difficulty = keyof typeof DIFFICULTY_TIME;

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const questionTime = difficulty ? DIFFICULTY_TIME[difficulty] : 35;

  // Pack shop state
  const [unlockedPacks, setUnlockedPacks] = useState<string[]>(["free"]);

  const activeScenarios = useMemo(() => getUnlockedScenarios(unlockedPacks), [unlockedPacks]);

  function buildQueue(): FormulaScenario[] {
    return shuffleArray(activeScenarios);
  }

  // Fetch owned packs
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/game-packs")
      .then((r) => r.json())
      .then((data) => {
        if (data.owned?.[GAME_ID]) setUnlockedPacks(data.owned[GAME_ID]);
      })
      .catch(() => {});
  }, [status]);

  const [scenarios, setScenarios] = useState<FormulaScenario[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showTrip, setShowTrip] = useState(false);
  const [hasContinued, setHasContinued] = useState(false);
  const [wattsSpent, setWattsSpent] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<"complete" | "strikes" | "timeout">("complete");
  const [stats, setStats] = useState<GameStats>({ highScore: 0, totalPlayed: 0, totalCorrect: 0 });
  const [timeLeft, setTimeLeft] = useState<number>(questionTime);
  const [dragItems, setDragItems] = useState<FormulaStep[]>([]);
  const [correctPositions, setCorrectPositions] = useState<Set<number>>(new Set());

  const [wildcards, setWildcards] = useState<WildcardInventory>({ freeze_timer: 0, extra_life: 0 });
  const [wildcardToast, setWildcardToast] = useState<WildcardType | null>(null);
  const timerFrozen = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentScenario = scenarios[currentIdx] as FormulaScenario | undefined;

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { setStats(loadStats(STORAGE_KEY)); }, []);
  useEffect(() => { return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); if (countdownRef.current) clearInterval(countdownRef.current); }; }, []);

  useEffect(() => {
    if (!currentScenario) return;
    const allSteps = [...currentScenario.steps, ...currentScenario.distractors];
    setDragItems(shuffleArray(allSteps));
    setCorrectPositions(new Set());
    setSubmitted(false);
    setIsCorrect(null);
     }, [currentIdx, scenarios]); // eslint-disable-line react-hooks/exhaustive-deps

  const energizeLevel = getEnergizeLevel(streak);

  const endGame = useCallback(
    (reason: "complete" | "strikes" | "timeout", finalCorrect?: number) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setGameOverReason(reason);
      setGameOver(true);
      const newStats = finalizeGame({ storageKey: STORAGE_KEY, activityType: "formula_builder", reason, currentStats: stats, score, totalCorrect, currentIdx, finalCorrect });
      setStats(newStats);
    },
    [totalCorrect, currentIdx, stats, score]
  );

  useEffect(() => {
    if (gameOver || scenarios.length === 0 || showTrip || submitted) return;
    setTimeLeft(questionTime);
    timerFrozen.current = false;
    countdownRef.current = setInterval(() => {
      if (timerFrozen.current) return;
      setTimeLeft((prev) => { if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [currentIdx, gameOver, scenarios.length, showTrip, questionTime, submitted]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted && !gameOver && scenarios.length > 0 && !showTrip) {
      haptic("error");
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong); setStreak(0); setSubmitted(true); setIsCorrect(false);      if (newWrong >= MAX_WRONG) { advanceTimerRef.current = setTimeout(() => { endGame("strikes"); }, 1200); } else { setShowTrip(true); }
    }
  }, [timeLeft, submitted, gameOver, scenarios.length, showTrip, wrongCount, endGame]);

  const advanceToNext = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (currentIdx + 1 >= scenarios.length) { endGame("complete"); } else {
      setSubmitted(false); setIsCorrect(null); setTimeLeft(questionTime); setCorrectPositions(new Set()); setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, scenarios.length, endGame, questionTime]);

  const handleSkip = useCallback(() => {
    if (submitted || skippedCount >= MAX_SKIPS) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSkippedCount((prev) => prev + 1); setStreak(0);
    if (currentIdx + 1 >= scenarios.length) { endGame("complete"); } else {
      setSubmitted(false); setIsCorrect(null); setTimeLeft(questionTime); setCorrectPositions(new Set()); setCurrentIdx((prev) => prev + 1);
    }
  }, [submitted, currentIdx, scenarios.length, endGame, questionTime]);

  const handleSubmit = useCallback(() => {
    if (submitted || !currentScenario) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSubmitted(true);
    const correctStepIds = currentScenario.steps.map((s) => s.id);
    const userStepIds = dragItems.slice(0, correctStepIds.length).map((s) => s.id);
    const correct = correctStepIds.every((id, i) => userStepIds[i] === id);
    setIsCorrect(correct);
    if (correct) {
      haptic("success");
      setCorrectPositions(new Set(correctStepIds.map((_, i) => i)));
      const newStreak = streak + 1;
      setScore(score + getComboMultiplier(newStreak)); setStreak(newStreak); setTotalCorrect(totalCorrect + 1);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (newStreak > 0 && newStreak % 3 === 0) fireStreakConfetti();
      const earned = checkWildcardEarned(newStreak);
      if (earned) {
        setWildcards((prev) => ({ ...prev, [earned]: prev[earned] + 1 }));
        setWildcardToast(earned);
        setTimeout(() => setWildcardToast(null), 2000);
      }
      advanceTimerRef.current = setTimeout(() => { advanceToNext(); }, 1500);
    } else {
      haptic("error");
      setWrongCount(wrongCount + 1); setStreak(0);
      const posSet = new Set<number>();
      correctStepIds.forEach((id, i) => { if (userStepIds[i] === id) posSet.add(i); });
      setCorrectPositions(posSet);
      setShowTrip(true);
    }
  }, [submitted, currentScenario, dragItems, score, streak, totalCorrect, bestStreak, wrongCount, advanceToNext]);

  const handleReshuffle = useCallback(() => {
    if (submitted || !currentScenario) return;
    const allSteps = [...currentScenario.steps, ...currentScenario.distractors];
    setDragItems(shuffleArray(allSteps));
  }, [submitted, currentScenario]);

  const handleUseWildcard = useCallback((type: WildcardType) => {
    if (wildcards[type] <= 0 || submitted) return;
    setWildcards((prev) => ({ ...prev, [type]: prev[type] - 1 }));
    if (type === "freeze_timer") {
      timerFrozen.current = true;
      haptic("success");
    } else if (type === "extra_life") {
      if (wrongCount > 0) { setWrongCount((prev) => prev - 1); haptic("success"); }
    }
  }, [wildcards, submitted, wrongCount]);

  const handleNewGame = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setScenarios(buildQueue()); setCurrentIdx(0); setScore(0); setStreak(0); setBestStreak(0); setTotalCorrect(0); setWrongCount(0); setSkippedCount(0);
    setSubmitted(false); setIsCorrect(null); setShowTrip(false); setHasContinued(false); setWattsSpent(0); setWildcards({ freeze_timer: 0, extra_life: 0 }); setWildcardToast(null); timerFrozen.current = false; setGameOver(false); setGameOverReason("complete"); setTimeLeft(questionTime); setCorrectPositions(new Set()); setDragItems([]);
  }, [questionTime]);

  const handleChangeDifficulty = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setScenarios(buildQueue()); setCurrentIdx(0); setScore(0); setStreak(0); setBestStreak(0); setTotalCorrect(0); setWrongCount(0); setSkippedCount(0);
    setSubmitted(false); setIsCorrect(null); setShowTrip(false); setHasContinued(false); setWattsSpent(0); setWildcards({ freeze_timer: 0, extra_life: 0 }); setWildcardToast(null); timerFrozen.current = false; setGameOver(false); setGameOverReason("complete"); setTimeLeft(35); setCorrectPositions(new Set()); setDragItems([]); setDifficulty(null);
  }, []);

  const handleContinueGame = useCallback(async () => {
    try {
      const res = await fetch("/api/game-continue", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setHasContinued(true);
        setWattsSpent((prev) => prev + CONTINUE_COST);
        setWrongCount(0);
        setShowTrip(false);
        setSubmitted(false);
        setIsCorrect(null);
        setTimeLeft(questionTime);
        setCorrectPositions(new Set());
        window.dispatchEvent(new CustomEvent("watts-updated", { detail: data.wattsBalance }));
      }
    } catch {}
  }, [questionTime]);

  if (status === "loading") return <GameLoadingFallback />;

  if (!difficulty) {
    const difficulties: Record<string, DifficultyConfig> = {
      easy: { label: "Easy", time: "45 seconds", desc: "Shorter sequences, fewer distractors" },
      medium: { label: "Medium", time: "35 seconds", desc: "Longer sequences with extra steps mixed in" },
      hard: { label: "Hard", time: "25 seconds", desc: "Maximum pressure — build fast or trip the breaker" },
    };
    return (
      <DifficultyPicker icon={Workflow} title="Builder" titleAccent="Formula" subtitle="Drag NEC articles into the correct sequence to solve each calculation scenario." difficulties={difficulties} stats={stats}
        onSelect={(level) => { setDifficulty(level as Difficulty); setTimeLeft(DIFFICULTY_TIME[level as Difficulty]); setScenarios(buildQueue()); }}
      />
    );
  }

  if (gameOver) {
    const answered = gameOverReason === "complete" ? scenarios.length : currentIdx + 1;
    const attempted = answered - skippedCount;
    const accuracy = attempted > 0 ? Math.round((totalCorrect / attempted) * 100) : 0;
    return (
      <GameOverScreen
        summaryTitle={gameOverReason === "strikes" ? "Circuit Overload!" : "Build Complete!"}
        summarySubtitle={gameOverReason === "strikes" ? `The breaker tripped ${MAX_WRONG} times — builder stalled after ${answered} scenarios` : `You\u2019ve assembled all ${scenarios.length} calculation sequences`}
        sparkyMsg={gameOverReason === "strikes" ? "Too many miswires! Study the NEC calculation procedures and try to nail the sequence next time!" : accuracy >= 80 ? "Master builder status! You really know the order of operations for NEC calculations!" : accuracy >= 50 ? "Good sequencing! Practice makes perfect — try again to tighten your process!" : "NEC calculations follow a strict order. Review the tips and build your step-by-step muscle memory!"}
        score={score} accuracy={accuracy} bestStreak={bestStreak} highScore={stats.highScore} skippedCount={skippedCount} gameOverReason={gameOverReason} maxWrong={MAX_WRONG} onPlayAgain={handleNewGame} onChangeDifficulty={handleChangeDifficulty}
        wattsEarned={totalCorrect * WATTS_PER_CORRECT} wattsSpent={wattsSpent}
      />
    );
  }

  const shouldShake = isCorrect === false && submitted;
  const correctStepCount = currentScenario?.steps.length ?? 0;

  return (
    <motion.main animate={shouldShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }} key={`shake-${wrongCount}`} className="relative min-h-screen bg-cream dark:bg-stone-950">
      <BlueprintBackground />
      <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10 flex flex-col">
        <GameHeader titleAccent="Formula" title="Builder" subtitle="Drag NEC articles into the correct sequence to solve the calculation." />

        <ScoreBar score={score} streak={streak} highScore={stats.highScore} timeLeft={timeLeft} maxTime={questionTime} wrongCount={wrongCount} maxWrong={MAX_WRONG} currentIdx={currentIdx} total={scenarios.length} onNewGame={handleNewGame} flameThreshold={2} timerWarning={5} multiplier={getComboMultiplier(streak)} />

        <QuestionCard label="Build the Calculation" energizeLevel={energizeLevel} currentIdx={currentIdx} isCorrect={isCorrect} className="mb-4 relative order-1 md:order-3"
          flipped={showTrip} tripInfo={currentScenario ? { term: currentScenario.title, tip: currentScenario.explanation, strikeCount: wrongCount, maxStrikes: MAX_WRONG } : undefined}
          onTripDismiss={() => { setShowTrip(false); if (wrongCount >= MAX_WRONG) { endGame("strikes"); } else { advanceToNext(); } }}
          canContinue={!hasContinued && wrongCount >= MAX_WRONG} onContinueGame={handleContinueGame}
        >
          <p className="text-xl md:text-2xl font-bold font-display text-foreground">{currentScenario?.title}</p>
          <p className="text-sm text-muted-foreground mt-2">{currentScenario?.description}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Arrange the first {correctStepCount} steps in order · {dragItems.length} items total</p>
        </QuestionCard>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-4 order-2 md:order-4">
          <Reorder.Group axis="y" values={dragItems} onReorder={submitted ? () => {} : setDragItems} className="space-y-2">
            {dragItems.map((step, idx) => {
              const isWithinSequence = idx < correctStepCount;
              const isPositionCorrect = submitted && correctPositions.has(idx);
              const isPositionWrong = submitted && isWithinSequence && !correctPositions.has(idx);
              const correctStepForPosition = submitted && currentScenario ? currentScenario.steps[idx] : null;

              return (
                <Reorder.Item key={step.id} value={step} dragListener={!submitted}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isPositionCorrect ? "border-emerald bg-emerald/10 dark:border-sparky-green dark:bg-sparky-green/10"
                    : isPositionWrong ? "border-red-500 bg-red-500/10"
                    : isWithinSequence ? "border-amber/30 bg-card dark:bg-stone-900/50 dark:border-stone-700"
                    : "border-border/50 bg-card/50 dark:bg-stone-900/30 dark:border-stone-800/50"
                  } ${!submitted ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!submitted && <GripVertical className="h-4 w-4 text-muted-foreground/50" />}
                    {submitted && isPositionCorrect && <Check className="h-4 w-4 text-emerald dark:text-sparky-green" />}
                    {submitted && isPositionWrong && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {submitted && !isWithinSequence && <div className="w-4 h-4" />}
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isWithinSequence ? "bg-amber/10 text-amber dark:bg-sparky-green/10 dark:text-sparky-green" : "bg-muted text-muted-foreground"}`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isPositionCorrect ? "text-emerald dark:text-sparky-green" : isPositionWrong ? "text-red-500 line-through" : "text-foreground"}`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                    {isPositionWrong && correctStepForPosition && <p className="text-xs text-emerald dark:text-sparky-green mt-0.5">Should be: {correctStepForPosition.label}</p>}
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="flex flex-col items-center gap-2 mb-6 order-3 md:order-5">
          {!submitted && (
            <>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleReshuffle} className="border-border dark:border-stone-700">
                  <Shuffle className="h-4 w-4 mr-1.5" />Reshuffle
                </Button>
                <Button onClick={handleSubmit} className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                  <Check className="h-4 w-4 mr-1.5" />Submit Order
                </Button>
                <SkipButton onClick={handleSkip} remaining={MAX_SKIPS - skippedCount} />
              </div>
              <WildcardBar wildcards={wildcards} onUse={handleUseWildcard} disabled={submitted} />
            </>
          )}
        </motion.div>

      </div>

      <WildcardEarnedToast type={wildcardToast} />
    </motion.main>
  );
}
