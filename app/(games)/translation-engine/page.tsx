"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Languages } from "lucide-react";
import { haptic } from "@/lib/haptics";

import {
  type GameStats,
  type DifficultyConfig,
  type MasteryUnlock,
  type MasteryProgress,
  type PickablePack,
  loadStats,
  BlueprintBackground,
  GameLoadingFallback,
  GameOverScreen,
  PackUnlockedOverlay,
  PackPicker,
  SkipButton,
  MAX_SKIPS,
  DifficultyPicker,
  ScoreBar,
  GameHeader,
  QuestionCard,
  AnswerButton,
  fireStreakConfetti,
  finalizeGame,
  CARD_GAME_RULES,
  CONTINUE_COST,
  HINT_COST,
  WATTS_PER_CORRECT,
  MASTERY_CORRECT_THRESHOLD,
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
  TRANSLATION_CARDS,
  TRANSLATION_MERGED_PACKS,
  shuffleCards,
  getDistractors,
  getEnergizeLevel,
  getUnlockedCards,
  type TranslationCard,
} from "./translation-data";

const GAME_ID: GameId = "translation-engine";
const STORAGE_KEY = "sparkypass-translation-engine";

export default function TranslationEnginePage() {
  return (
    <Suspense fallback={<GameLoadingFallback />}>
      <TranslationEngineContent />
    </Suspense>
  );
}

function TranslationEngineContent() {
  const { status } = useSession();
  const router = useRouter();

  const { MAX_WRONG, DIFFICULTY_TIME, DIFFICULTY_OPTIONS } = CARD_GAME_RULES;

  const [difficulty, setDifficulty] = useState<CardGameDifficulty | null>(null);
  const questionTime = difficulty ? DIFFICULTY_TIME[difficulty] : 10;
  const optionCount = difficulty ? DIFFICULTY_OPTIONS[difficulty] : 8;

  // Pack selection (null = show pack picker after difficulty is chosen)
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // Pack / mastery state
  const [unlockedPacks, setUnlockedPacks] = useState<string[]>(["free"]);
  const [masteryProgress, setMasteryProgress] = useState<MasteryProgress | null>(null);
  const [newUnlock, setNewUnlock] = useState<MasteryUnlock | null>(null);
  const [showUnlockOverlay, setShowUnlockOverlay] = useState(false);
  const unlockCheckedRef = useRef(false);

  // Build active cards from selected pack(s)
  const activeCards = useMemo(() => {
    if (selectedPackId === "all") {
      const unlockedSet = new Set(unlockedPacks);
      return TRANSLATION_MERGED_PACKS.filter((p) => unlockedSet.has(p.id) || p.id === "free").flatMap((p) => p.cards);
    }
    if (selectedPackId) {
      const pack = TRANSLATION_MERGED_PACKS.find((p) => p.id === selectedPackId);
      return pack ? pack.cards : [];
    }
    return getUnlockedCards(unlockedPacks);
  }, [unlockedPacks, selectedPackId]);

  // Build pickable pack list from merged packs
  const pickablePacks = useMemo((): PickablePack[] => {
    const maxUnlocked = masteryProgress?.unlockedIndex ?? 0;
    return TRANSLATION_MERGED_PACKS.map((pack, idx) => ({
      id: pack.id,
      name: pack.name,
      cardCount: pack.cards.length,
      locked: idx > maxUnlocked,
    }));
  }, [masteryProgress]);

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

  const [cards, setCards] = useState<TranslationCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const totalCorrectRef = useRef(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showTrip, setShowTrip] = useState(false);
  const [hasContinued, setHasContinued] = useState(false);
  const [wattsSpent, setWattsSpent] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<
    "complete" | "strikes" | "timeout"
  >("complete");
  const [stats, setStats] = useState<GameStats>({
    highScore: 0,
    totalPlayed: 0,
    totalCorrect: 0,
  });
  const [timeLeft, setTimeLeft] = useState<number>(questionTime);
  const [hintUsed, setHintUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<string>>(new Set());
  const [wildcards, setWildcards] = useState<WildcardInventory>({ freeze_timer: 0, extra_life: 0 });
  const [wildcardToast, setWildcardToast] = useState<WildcardType | null>(null);
  const timerFrozen = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);
  useEffect(() => {
    setStats(loadStats(STORAGE_KEY));
    setCards(shuffleCards(activeCards));
  }, []);
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const currentCard = cards[currentIdx] as TranslationCard | undefined;
  const energizeLevel = getEnergizeLevel(streak);

  const answerOptions = useMemo(() => {
    if (!currentCard) return [];
    const distractors = getDistractors(
      currentCard.officialTerm,
      TRANSLATION_CARDS,
      optionCount - 1,
    );
    const options = [currentCard.officialTerm, ...distractors];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, optionCount, cards]);

  const endGame = useCallback(
    (reason: "complete" | "strikes" | "timeout") => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setGameOverReason(reason);
      setGameOver(true);
      const finalCorrect = totalCorrectRef.current;
      const newStats = finalizeGame({
        storageKey: STORAGE_KEY,
        activityType: "translation_engine",
        reason,
        currentStats: stats,
        score,
        totalCorrect: finalCorrect,
        currentIdx,
      });
      setStats(newStats);

      // Single mastery API call per session — persists unlock and progress
      fetch("/api/game-mastery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: GAME_ID, totalCorrect: finalCorrect }),
      })
        .then((r) => r.ok ? r.json() : r.text().then((t) => { throw new Error(t); }))
        .then((data) => {
          if (data.unlocked && !unlockCheckedRef.current) {
            const nextPack = TRANSLATION_MERGED_PACKS[data.newPackIndex];
            if (nextPack) {
              setNewUnlock({ packId: nextPack.id, packName: nextPack.name, cardCount: nextPack.cards.length });
              setUnlockedPacks((prev) => prev.includes(nextPack.id) ? prev : [...prev, nextPack.id]);
            }
          }
          const idx = data.newPackIndex ?? data.currentPackIndex;
          setMasteryProgress((prev) => prev ? {
            ...prev,
            bestCorrect: data.bestCorrect ?? prev.bestCorrect,
            unlockedIndex: idx ?? prev.unlockedIndex,
          } : prev);
          fetch("/api/game-packs").then((r) => r.json()).then((d) => {
            if (d.owned?.[GAME_ID]) setUnlockedPacks(d.owned[GAME_ID]);
            if (d.mastery?.[GAME_ID]) setMasteryProgress(d.mastery[GAME_ID]);
          }).catch(() => {});
        })
        .catch(() => {});
    },
    [currentIdx, stats, score],
  );

  useEffect(() => {
    if (gameOver || cards.length === 0 || showTrip || showUnlockOverlay) return;
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
  }, [
    currentIdx,
    gameOver,
    cards.length,
    selected,
    showTrip,
    showUnlockOverlay,
    questionTime,
  ]);

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
    if (
      timeLeft === 0 &&
      selected === null &&
      !gameOver &&
      cards.length > 0 &&
      !showTrip
    ) {
      haptic("error");
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      setStreak(0);
      setSelected(currentCard?.officialTerm ?? null);
      setIsCorrect(false);
      if (newWrong >= MAX_WRONG) {
        advanceTimerRef.current = setTimeout(() => {
          endGame("strikes");
        }, 1200);
      } else {
        setShowTrip(true);
      }
    }
  }, [
    timeLeft,
    selected,
    gameOver,
    cards.length,
    showTrip,
    wrongCount,
    currentCard,
    endGame,
  ]);

  const handleSelect = useCallback(
    (officialTerm: string) => {
      if (selected !== null || !currentCard) return;
      if (countdownRef.current) clearInterval(countdownRef.current);
      setSelected(officialTerm);
      const correct = officialTerm === currentCard.officialTerm;
      setIsCorrect(correct);
      if (correct) {
        haptic("success");
        const newStreak = streak + 1;
        const newTotalCorrect = totalCorrect + 1;
        totalCorrectRef.current = newTotalCorrect;
        setScore(score + getComboMultiplier(newStreak));
        setStreak(newStreak);
        setTotalCorrect(newTotalCorrect);
        if (newStreak > bestStreak) setBestStreak(newStreak);
        if (newStreak > 0 && newStreak % 5 === 0) fireStreakConfetti();
        const earned = checkWildcardEarned(newStreak);
        if (earned) {
          setWildcards((prev) => ({ ...prev, [earned]: prev[earned] + 1 }));
          setWildcardToast(earned);
          setTimeout(() => setWildcardToast(null), 2000);
        }

        // Check for mastery unlock mid-game — show overlay instantly (persist at endGame only)
        if (
          newTotalCorrect >= MASTERY_CORRECT_THRESHOLD &&
          !unlockCheckedRef.current &&
          masteryProgress &&
          masteryProgress.unlockedIndex < masteryProgress.totalPacks - 1
        ) {
          unlockCheckedRef.current = true;
          const nextPackIdx = masteryProgress.unlockedIndex + 1;
          const nextPack = TRANSLATION_MERGED_PACKS[nextPackIdx];
          if (nextPack) {
            setNewUnlock({ packId: nextPack.id, packName: nextPack.name, cardCount: nextPack.cards.length });
            setShowUnlockOverlay(true);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setUnlockedPacks((prev) => [...prev, nextPack.id]);
          }
          return; // Don't auto-advance — overlay dismiss handles it
        }

        advanceTimerRef.current = setTimeout(() => {
          advanceToNext();
        }, 800);
      } else {
        haptic("error");
        setWrongCount(wrongCount + 1);
        setStreak(0);
        setShowTrip(true);
      }
    },
    [
      selected,
      currentCard,
      score,
      streak,
      totalCorrect,
      bestStreak,
      wrongCount,
      advanceToNext,
      masteryProgress,
      showUnlockOverlay,
    ],
  );

  const handleUnlockDismiss = useCallback(() => {
    setShowUnlockOverlay(false);
    advanceToNext();
  }, [advanceToNext]);

  const handleHint = useCallback(async () => {
    if (hintUsed || selected !== null || !currentCard) return;
    try {
      const res = await fetch("/api/game-hint", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setHintUsed(true);
        setWattsSpent((prev) => prev + HINT_COST);
        const wrongOptions = answerOptions.filter((t) => t !== currentCard.officialTerm);
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
    totalCorrectRef.current = 0;
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
    setShowUnlockOverlay(false);
    unlockCheckedRef.current = false;
    setGameOver(false);
    setGameOverReason("complete");
    setTimeLeft(questionTime);
  }, [questionTime, activeCards]);

  const handlePlayNewCards = useCallback(() => {
    if (!newUnlock) return;
    const pack = TRANSLATION_MERGED_PACKS.find((p) => p.id === newUnlock.packId);
    if (!pack) return;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSelectedPackId(pack.id);
    setCards(shuffleCards(pack.cards));
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    totalCorrectRef.current = 0;
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
    setShowUnlockOverlay(false);
    unlockCheckedRef.current = false;
    setGameOver(false);
    setGameOverReason("complete");
    setTimeLeft(questionTime);
  }, [newUnlock, questionTime]);

  const handleChangeDifficulty = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCards(shuffleCards(activeCards));
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    totalCorrectRef.current = 0;
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
    setShowUnlockOverlay(false);
    unlockCheckedRef.current = false;
    setGameOver(false);
    setGameOverReason("complete");
    setTimeLeft(10);
    setDifficulty(null);
    setSelectedPackId(null);
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
      easy: {
        label: "Easy",
        time: "20 seconds",
        desc: "Warm up with fewer distractors",
        extra: "4 choices",
      },
      medium: {
        label: "Medium",
        time: "10 seconds",
        desc: "More official terms to sort through",
        extra: "8 choices",
      },
      hard: {
        label: "Hard",
        time: "5 seconds",
        desc: "Maximum pressure — know your terminology cold",
        extra: "12 choices",
      },
    };

    return (
      <DifficultyPicker
        icon={Languages}
        title="Code"
        titleAccent="Slang to"
        subtitle="Translate job site slang into official NEC terminology. Speak the code."
        difficulties={difficulties}
        stats={stats}
        onSelect={(level) => {
          setDifficulty(level as CardGameDifficulty);
          setTimeLeft(DIFFICULTY_TIME[level as CardGameDifficulty]);
        }}
      />
    );
  }

  // Pack picker — shown after difficulty is selected, before game starts
  if (!selectedPackId) {
    const startGame = (packId: string) => {
      setSelectedPackId(packId);
      setTimeout(() => {
        const cards = packId === "all"
          ? TRANSLATION_MERGED_PACKS.filter((p) => !pickablePacks.find((pp) => pp.id === p.id && pp.locked)).flatMap((p) => p.cards)
          : TRANSLATION_MERGED_PACKS.find((p) => p.id === packId)?.cards ?? [];
        setCards(shuffleCards(cards));
      }, 0);
    };

    const unlockedCount = pickablePacks.filter((p) => !p.locked).length;

    return (
      <PackPicker
        packs={pickablePacks}
        onSelect={startGame}
        onSelectAll={() => startGame("all")}
        unlockedCount={unlockedCount}
        totalCount={pickablePacks.length}
      />
    );
  }

  if (gameOver) {
    const answered =
      gameOverReason === "complete" ? cards.length : currentIdx + 1;
    const attempted = answered - skippedCount;
    const accuracy =
      attempted > 0 ? Math.round((totalCorrect / attempted) * 100) : 0;
    return (
      <GameOverScreen
        summaryTitle={
          gameOverReason === "strikes"
            ? "Circuit Overload!"
            : "Slang Decoded!"
        }
        summarySubtitle={
          gameOverReason === "strikes"
            ? `The breaker tripped ${MAX_WRONG} times — engine stalled after ${answered} translations`
            : `You\u2019ve translated all ${cards.length} slang terms`
        }
        sparkyMsg={
          gameOverReason === "strikes"
            ? "Too many mistranslations! Study the official NEC terms and try to keep the engine running next time!"
            : accuracy >= 80
              ? "Incredible fluency! You really know your NEC terminology. Certified translator status!"
              : accuracy >= 50
                ? "Good translations! Practice makes perfect — try again to sharpen your vocabulary!"
                : "The NEC has its own language. Review the tips and build your codebook vocabulary!"
        }
        score={score}
        accuracy={accuracy}
        bestStreak={bestStreak}
        skippedCount={skippedCount}
        gameOverReason={gameOverReason}
        highScore={stats.highScore}
        maxWrong={MAX_WRONG}
        onPlayAgain={handleNewGame}
        onPlayNewCards={newUnlock ? handlePlayNewCards : undefined}
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
        <GameHeader
          titleAccent="Slang to"
          title="Code"
          subtitle="Translate job site slang into official NEC terminology. Speak the code."
        />

        <ScoreBar
          score={score}
          streak={streak}
          highScore={stats.highScore}
          timeLeft={timeLeft}
          maxTime={questionTime}
          wrongCount={wrongCount}
          maxWrong={MAX_WRONG}
          currentIdx={currentIdx}
          total={cards.length}
          onNewGame={handleNewGame}
          multiplier={getComboMultiplier(streak)}
        />

        <QuestionCard
          label="Translate the Slang"
          energizeLevel={energizeLevel}
          currentIdx={currentIdx}
          isCorrect={isCorrect}
          flipped={showTrip}
          tripInfo={currentCard ? { term: currentCard.slang, tip: `The official term is "${currentCard.officialTerm}" — ${currentCard.description}`, strikeCount: wrongCount, maxStrikes: MAX_WRONG } : undefined}
          onTripDismiss={() => { setShowTrip(false); if (wrongCount >= MAX_WRONG) { endGame("strikes"); } else { advanceToNext(); } }}
          canContinue={!hasContinued && wrongCount >= MAX_WRONG} onContinueGame={handleContinueGame}
        >
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            &ldquo;{currentCard?.slang}&rdquo;
          </p>
          {currentCard?.reference && (
            <p className="text-sm text-muted-foreground mt-2 font-mono">
              {currentCard.reference}
            </p>
          )}
        </QuestionCard>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 order-2 md:order-4"
        >
          <div
            className={`grid gap-2 ${optionCount <= 8 ? "grid-cols-1 sm:grid-cols-2" : optionCount <= 10 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
          >
            {answerOptions.filter((term) => !eliminatedOptions.has(term)).map((term) => (
              <AnswerButton
                key={term}
                value={term}
                isSelected={selected === term}
                isAnswer={currentCard?.officialTerm === term}
                isCorrect={isCorrect}
                hasSelection={selected !== null}
                onClick={() => handleSelect(term)}
                className="text-left justify-start"
              />
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

      <AnimatePresence>
        {showUnlockOverlay && newUnlock && (
          <PackUnlockedOverlay
            packName={newUnlock.packName}
            cardCount={newUnlock.cardCount}
            onContinue={handleUnlockDismiss}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
