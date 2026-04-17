"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import { haptic } from "@/lib/haptics";

import {
  type GameStats,
  type DifficultyConfig,
  type MasteryUnlock,
  type MasteryProgress,
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
  AnswerButton,
  fireStreakConfetti,
  fireCompletionConfetti,
  finalizeGame,
  CARD_GAME_RULES,
  CONTINUE_COST,
  HINT_COST,
  WATTS_PER_CORRECT,
  MASTERY_STREAK_THRESHOLD,
  HintButton,
  getComboMultiplier,
  checkWildcardEarned,
  WildcardBar,
  WildcardEarnedToast,
  type WildcardType,
  type WildcardInventory,
  type CardGameDifficulty,
} from "../shared";

import type { GameId } from "@/lib/game-packs";

import {
  SNIPER_CARDS,
  shuffleCards,
  getDistractors,
  getEnergizeLevel,
  getUnlockedCards,
  type SniperCard,
} from "./sniper-data";

const GAME_ID: GameId = "index-sniper";
const STORAGE_KEY = "sparkypass-index-sniper";

export default function IndexSniperPage() {
  return (
    <Suspense fallback={<GameLoadingFallback />}>
      <IndexSniperContent />
    </Suspense>
  );
}

function IndexSniperContent() {
  const { status } = useSession();
  const router = useRouter();

  const { MAX_WRONG, DIFFICULTY_TIME, DIFFICULTY_OPTIONS } = CARD_GAME_RULES;

  // Difficulty selection (null = show picker)
  const [difficulty, setDifficulty] = useState<CardGameDifficulty | null>(null);
  const questionTime = difficulty ? DIFFICULTY_TIME[difficulty] : 10;
  const optionCount = difficulty ? DIFFICULTY_OPTIONS[difficulty] : 8;

  // Pack state
  const [unlockedPacks, setUnlockedPacks] = useState<string[]>(["free"]);
  const [masteryProgress, setMasteryProgress] = useState<MasteryProgress | null>(null);
  const [newUnlock, setNewUnlock] = useState<MasteryUnlock | null>(null);

  const activeCards = useMemo(() => getUnlockedCards(unlockedPacks), [unlockedPacks]);

  // Fetch owned packs + mastery state
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/game-packs")
      .then((r) => r.json())
      .then((data) => {
        if (data.owned?.[GAME_ID]) setUnlockedPacks(data.owned[GAME_ID]);
        if (data.mastery?.[GAME_ID]) setMasteryProgress(data.mastery[GAME_ID]);
      })
      .catch(() => {});
  }, [status]);

  // Game state
  const [cards, setCards] = useState<SniperCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showTrip, setShowTrip] = useState(false);
  const [hasContinued, setHasContinued] = useState(false);
  const [wattsSpent, setWattsSpent] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<"complete" | "strikes" | "timeout">("complete");
  const [stats, setStats] = useState<GameStats>({ highScore: 0, totalPlayed: 0, totalCorrect: 0 });
  const [timeLeft, setTimeLeft] = useState<number>(questionTime);
  const [hintUsed, setHintUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<string>>(new Set());
  const [wildcards, setWildcards] = useState<WildcardInventory>({ freeze_timer: 0, extra_life: 0 });
  const [wildcardToast, setWildcardToast] = useState<WildcardType | null>(null);
  const timerFrozen = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load stats & init
  useEffect(() => {
    setStats(loadStats(STORAGE_KEY));
    setCards(shuffleCards(activeCards));
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const currentCard = cards[currentIdx] as SniperCard | undefined;
  const energizeLevel = getEnergizeLevel(streak);

  // Generate answer options for current question
  const answerOptions = useMemo(() => {
    if (!currentCard) return [];
    const smartFilter = difficulty === "easy";
    const distractors = getDistractors(currentCard.reference, SNIPER_CARDS, optionCount - 1, smartFilter);
    const options = [currentCard.reference, ...distractors];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, optionCount, cards]);

  const endGame = useCallback(
    (reason: "complete" | "strikes" | "timeout", finalCorrect?: number) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setGameOverReason(reason);
      setGameOver(true);
      const newStats = finalizeGame({
        storageKey: STORAGE_KEY,
        activityType: "index_sniper",
        reason,
        currentStats: stats,
        score,
        totalCorrect,
        currentIdx,
        finalCorrect,
      });
      setStats(newStats);

      // Report mastery progress
      const sessionBest = Math.max(bestStreak, reason === "complete" ? bestStreak : bestStreak);
      fetch("/api/game-mastery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: GAME_ID, bestStreak: sessionBest }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.unlocked) {
            setNewUnlock({ packName: data.newPackName, cardCount: data.newPackCardCount });
            // Re-fetch packs so next game includes new cards
            fetch("/api/game-packs")
              .then((r) => r.json())
              .then((d) => {
                if (d.owned?.[GAME_ID]) setUnlockedPacks(d.owned[GAME_ID]);
                if (d.mastery?.[GAME_ID]) setMasteryProgress(d.mastery[GAME_ID]);
              })
              .catch(() => {});
            fireCompletionConfetti();
          } else {
            if (data.bestStreak !== undefined && masteryProgress) {
              setMasteryProgress((prev) => prev ? { ...prev, bestStreak: data.bestStreak } : prev);
            }
          }
        })
        .catch(() => {});
    },
    [totalCorrect, currentIdx, stats, score, bestStreak, masteryProgress]
  );

  useEffect(() => {
    if (gameOver || cards.length === 0 || showTrip) return;
    if (selected !== null) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    setTimeLeft(questionTime);
    timerFrozen.current = false;
    countdownRef.current = setInterval(() => {
      if (timerFrozen.current) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentIdx, gameOver, cards.length, selected, showTrip, questionTime]);

  const advanceToNext = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (currentIdx + 1 >= cards.length) {
      endGame("complete");
    } else {
      setSelected(null);
      setIsCorrect(null);
      setHintUsed(false);
      setEliminatedOptions(new Set());
      setTimeLeft(questionTime);
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, cards.length, endGame, questionTime]);

  const handleSkip = useCallback(() => {
    if (selected !== null || skippedCount >= MAX_SKIPS) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSkippedCount((prev) => prev + 1);
    setStreak(0);
    if (currentIdx + 1 >= cards.length) {
      endGame("complete");
    } else {
      setSelected(null);
      setIsCorrect(null);
      setTimeLeft(questionTime);
      setCurrentIdx((prev) => prev + 1);
    }
  }, [selected, currentIdx, cards.length, endGame, questionTime]);

  useEffect(() => {
    if (timeLeft === 0 && selected === null && !gameOver && cards.length > 0 && !showTrip) {
      haptic("error");
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      setStreak(0);
      setSelected(currentCard?.reference ?? null);
      setIsCorrect(false);

      if (newWrong >= MAX_WRONG) {
        advanceTimerRef.current = setTimeout(() => {
          endGame("strikes");
        }, 1200);
      } else {
        setShowTrip(true);
      }
    }
  }, [timeLeft, selected, gameOver, cards.length, showTrip, wrongCount, currentCard, endGame]);

  const handleSelect = useCallback(
    (reference: string) => {
      if (selected !== null || !currentCard) return;
      if (countdownRef.current) clearInterval(countdownRef.current);

      setSelected(reference);
      const correct = reference === currentCard.reference;
      setIsCorrect(correct);

      if (correct) {
        haptic("success");
        const newStreak = streak + 1;
        const newScore = score + getComboMultiplier(newStreak);
        const newTotalCorrect = totalCorrect + 1;
        setScore(newScore);
        setStreak(newStreak);
        setTotalCorrect(newTotalCorrect);
        if (newStreak > bestStreak) setBestStreak(newStreak);

        if (newStreak > 0 && newStreak % 5 === 0) {
          fireStreakConfetti();
        }

        const earned = checkWildcardEarned(newStreak);
        if (earned) {
          setWildcards((prev) => ({ ...prev, [earned]: prev[earned] + 1 }));
          setWildcardToast(earned);
          setTimeout(() => setWildcardToast(null), 2000);
        }

        advanceTimerRef.current = setTimeout(() => {
          advanceToNext();
        }, 800);
      } else {
        haptic("error");
        const newWrong = wrongCount + 1;
        setWrongCount(newWrong);
        setStreak(0);
        setShowTrip(true);
      }
    },
    [selected, currentCard, score, streak, totalCorrect, bestStreak, wrongCount, advanceToNext]
  );

  const handleHint = useCallback(async () => {
    if (hintUsed || selected !== null || !currentCard) return;
    try {
      const res = await fetch("/api/game-hint", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setHintUsed(true);
        setWattsSpent((prev) => prev + HINT_COST);
        const wrongOptions = answerOptions.filter((ref) => ref !== currentCard.reference);
        const toEliminate = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
        setEliminatedOptions(new Set(toEliminate));
        window.dispatchEvent(new CustomEvent("watts-updated", { detail: data.wattsBalance }));
      }
    } catch {}
  }, [hintUsed, selected, currentCard, answerOptions]);

  const handleUseWildcard = useCallback((type: WildcardType) => {
    if (wildcards[type] <= 0 || selected !== null) return;
    setWildcards((prev) => ({ ...prev, [type]: prev[type] - 1 }));
    if (type === "freeze_timer") {
      timerFrozen.current = true;
      haptic("success");
    } else if (type === "extra_life") {
      if (wrongCount > 0) { setWrongCount((prev) => prev - 1); haptic("success"); }
    }
  }, [wildcards, selected, wrongCount]);

  const handleNewGame = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCards(shuffleCards(activeCards));
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    setWrongCount(0);
    setSkippedCount(0);
    setSelected(null);
    setIsCorrect(null);
    setShowTrip(false);
    setHasContinued(false);
    setWattsSpent(0);
    setHintUsed(false);
    setEliminatedOptions(new Set());
    setWildcards({ freeze_timer: 0, extra_life: 0 });
    setWildcardToast(null);
    timerFrozen.current = false;
    setNewUnlock(null);
    setGameOver(false);
    setGameOverReason("complete");
    setTimeLeft(questionTime);
  }, [questionTime, activeCards]);

  const handleChangeDifficulty = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCards(shuffleCards(activeCards));
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    setWrongCount(0);
    setSkippedCount(0);
    setSelected(null);
    setIsCorrect(null);
    setShowTrip(false);
    setHintUsed(false);
    setEliminatedOptions(new Set());
    setWildcards({ freeze_timer: 0, extra_life: 0 });
    setWildcardToast(null);
    timerFrozen.current = false;
    setWattsSpent(0);
    setNewUnlock(null);
    setGameOver(false);
    setGameOverReason("complete");
    setTimeLeft(10);
    setDifficulty(null);
    setHasContinued(false);
  }, [activeCards]);

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
        setSelected(null);
        setIsCorrect(null);
        setTimeLeft(questionTime);
        window.dispatchEvent(new CustomEvent("watts-updated", { detail: data.wattsBalance }));
      }
    } catch {}
  }, [questionTime]);

  if (status === "loading") return <GameLoadingFallback />;

  if (!difficulty) {
    const difficulties: Record<string, DifficultyConfig> = {
      easy: { label: "Easy", time: "20 seconds", desc: "Warm up with fewer distractors", extra: "4 choices" },
      medium: { label: "Medium", time: "10 seconds", desc: "More references to sort through", extra: "8 choices" },
      hard: { label: "Hard", time: "5 seconds", desc: "Maximum pressure — know your code cold", extra: "12 choices" },
    };
    return (
      <DifficultyPicker
        icon={Crosshair}
        title="Sniper"
        titleAccent="Index"
        subtitle="Match each NEC field term to its exact code reference. Precision is everything."
        difficulties={difficulties}
        stats={stats}
        onSelect={(level) => {
          setDifficulty(level as CardGameDifficulty);
          setTimeLeft(DIFFICULTY_TIME[level as CardGameDifficulty]);
          setCards(shuffleCards(activeCards));
        }}
      />
    );
  }

  if (gameOver) {
    const answered = gameOverReason === "complete" ? cards.length : currentIdx + 1;
    const attempted = answered - skippedCount;
    const accuracy = attempted > 0 ? Math.round((totalCorrect / attempted) * 100) : 0;

    return (
      <GameOverScreen
        summaryTitle={gameOverReason === "strikes" ? "Circuit Overload!" : "Mission Complete!"}
        summarySubtitle={gameOverReason === "strikes"
          ? `The breaker tripped ${MAX_WRONG} times — circuit shut down after ${answered} references`
          : `You\u2019ve sniped through all ${cards.length} references`}
        sparkyMsg={gameOverReason === "strikes"
          ? "Too many misses! Study the exact code references and try to keep your aim steady next time!"
          : accuracy >= 80
            ? "Incredible precision! You really know your NEC references. Sharpshooter status!"
            : accuracy >= 50
              ? "Good shooting! Practice makes perfect — try again to tighten your grouping!"
              : "The NEC has a lot of references to memorize. Review the tips and sharpen your aim!"}
        score={score}
        accuracy={accuracy}
        bestStreak={bestStreak}
        skippedCount={skippedCount}
        gameOverReason={gameOverReason}
        highScore={stats.highScore}
        maxWrong={MAX_WRONG}
        onPlayAgain={handleNewGame}
        onChangeDifficulty={handleChangeDifficulty}
        wattsEarned={totalCorrect * WATTS_PER_CORRECT}
        wattsSpent={wattsSpent}
        newUnlock={newUnlock}
        masteryProgress={masteryProgress}
      />
    );
  }

  const shouldShake = isCorrect === false && selected !== null;

  return (
    <motion.main
      animate={shouldShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      key={`shake-${wrongCount}`}
      className="relative min-h-screen bg-cream dark:bg-stone-950"
    >
      <BlueprintBackground />
      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10 flex flex-col">
        <GameHeader titleAccent="Index" title="Sniper" subtitle="Match each NEC field term to its exact code reference. Precision is everything." />

        <ScoreBar score={score} streak={streak} highScore={stats.highScore} timeLeft={timeLeft} maxTime={questionTime} wrongCount={wrongCount} maxWrong={MAX_WRONG} currentIdx={currentIdx} total={cards.length} onNewGame={handleNewGame} multiplier={getComboMultiplier(streak)} />

        <QuestionCard label="Find the Reference" energizeLevel={energizeLevel} currentIdx={currentIdx} isCorrect={isCorrect}
          flipped={showTrip} tripInfo={currentCard ? { term: currentCard.term, tip: `The correct reference is ${currentCard.reference} — ${currentCard.description}`, strikeCount: wrongCount, maxStrikes: MAX_WRONG } : undefined}
          onTripDismiss={() => { setShowTrip(false); if (wrongCount >= MAX_WRONG) { endGame("strikes"); } else { advanceToNext(); } }}
          canContinue={!hasContinued && wrongCount >= MAX_WRONG} onContinueGame={handleContinueGame}
        >
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">{currentCard?.term}</p>
          {currentCard?.description && <p className="text-sm text-muted-foreground mt-2">{currentCard.description}</p>}
        </QuestionCard>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6 order-2 md:order-4">
          <div className={`grid gap-2 ${optionCount <= 4 ? "grid-cols-2" : optionCount <= 8 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-4"}`}>
            {answerOptions.filter((ref) => !eliminatedOptions.has(ref)).map((ref) => (
              <AnswerButton key={ref} value={ref} isSelected={selected === ref} isAnswer={currentCard?.reference === ref} isCorrect={isCorrect} hasSelection={selected !== null} onClick={() => handleSelect(ref)} className="font-mono" />
            ))}
          </div>
          {selected === null && (
            <div className="flex flex-col items-center gap-2 mt-3">
              <div className="flex items-center gap-2">
                <SkipButton onClick={handleSkip} remaining={MAX_SKIPS - skippedCount} />
                {!hintUsed && <HintButton onClick={handleHint} />}
              </div>
              <WildcardBar wildcards={wildcards} onUse={handleUseWildcard} disabled={selected !== null} />
            </div>
          )}
        </motion.div>

      </div>

      <WildcardEarnedToast type={wildcardToast} />
    </motion.main>
  );
}
