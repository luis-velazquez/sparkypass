"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Target } from "lucide-react";
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
  SparkyTip,
  TripOverlay,
  DifficultyPicker,
  ScoreBar,
  GameHeader,
  QuestionCard,
  AnswerButton,
  fireStreakConfetti,
  finalizeGame,
} from "../shared";

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

export default function IndexGamePage() {
  return (
    <Suspense fallback={<GameLoadingFallback />}>
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

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const questionTime = difficulty ? DIFFICULTY_TIME[difficulty] : 10;

  const [terms, setTerms] = useState<AnchoringTerm[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
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
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { setStats(loadStats(STORAGE_KEY)); setTerms(shuffleTerms(ANCHORING_TERMS)); }, []);
  useEffect(() => { return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); if (countdownRef.current) clearInterval(countdownRef.current); }; }, []);

  const currentTerm = terms[currentIdx] as AnchoringTerm | undefined;
  const energizeLevel = getEnergizeLevel(streak);

  const endGame = useCallback(
    (reason: "complete" | "strikes" | "timeout", finalCorrect?: number) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setGameOverReason(reason);
      setGameOver(true);
      const newStats = finalizeGame({ storageKey: STORAGE_KEY, activityType: "index_game", reason, currentStats: stats, score, totalCorrect, currentIdx, finalCorrect });
      setStats(newStats);
    },
    [totalCorrect, currentIdx, stats, score]
  );

  useEffect(() => {
    if (gameOver || terms.length === 0 || showTrip || showTip) return;
    if (selected !== null) { if (countdownRef.current) clearInterval(countdownRef.current); return; }
    setTimeLeft(questionTime);
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => { if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [currentIdx, gameOver, terms.length, selected, showTrip, showTip, questionTime]);

  const advanceToNext = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (currentIdx + 1 >= terms.length) { endGame("complete"); } else {
      setSelected(null); setIsCorrect(null); setShowTip(false); setTipText(""); setReactionText(""); setTimeLeft(questionTime); setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, terms.length, endGame, questionTime]);

  const handleSkip = useCallback(() => {
    if (selected !== null || skippedCount >= MAX_SKIPS) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSkippedCount((prev) => prev + 1); setStreak(0);
    if (currentIdx + 1 >= terms.length) { endGame("complete"); } else {
      setSelected(null); setIsCorrect(null); setShowTip(false); setTipText(""); setReactionText(""); setTimeLeft(questionTime); setCurrentIdx((prev) => prev + 1);
    }
  }, [selected, currentIdx, terms.length, endGame, questionTime]);

  useEffect(() => {
    if (timeLeft === 0 && selected === null && !gameOver && terms.length > 0 && !showTrip && !showTip) {
      haptic("error");
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong); setStreak(0); setSelected(currentTerm?.parent ?? null); setIsCorrect(false); setReactionText("Time\u2019s up!");
      if (newWrong >= MAX_WRONG) { advanceTimerRef.current = setTimeout(() => { endGame("strikes"); }, 1200); } else { setShowTrip(true); }
    }
  }, [timeLeft, selected, gameOver, terms.length, showTrip, showTip, wrongCount, currentTerm, endGame]);

  const handleSelect = useCallback(
    (category: AnchorCategory) => {
      if (selected !== null || !currentTerm) return;
      if (countdownRef.current) clearInterval(countdownRef.current);
      setSelected(category);
      const correct = category === currentTerm.parent;
      setIsCorrect(correct);
      if (correct) {
        haptic("success");
        const newStreak = streak + 1;
        setScore(score + 1); setStreak(newStreak); setTotalCorrect(totalCorrect + 1);
        if (newStreak > bestStreak) setBestStreak(newStreak);
        setReactionText(CORRECT_REACTIONS[Math.floor(Math.random() * CORRECT_REACTIONS.length)]);
        if (newStreak > 0 && newStreak % 5 === 0) fireStreakConfetti();
        advanceTimerRef.current = setTimeout(() => { advanceToNext(); }, 800);
      } else {
        haptic("error");
        setWrongCount(wrongCount + 1); setStreak(0);
        setReactionText(TRIP_MESSAGES[Math.floor(Math.random() * TRIP_MESSAGES.length)]);
        setShowTrip(true);
      }
    },
    [selected, currentTerm, score, streak, totalCorrect, bestStreak, wrongCount, advanceToNext]
  );

  const handleNewGame = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setTerms(shuffleTerms(ANCHORING_TERMS)); setCurrentIdx(0); setScore(0); setStreak(0); setBestStreak(0); setTotalCorrect(0); setWrongCount(0); setSkippedCount(0);
    setSelected(null); setIsCorrect(null); setShowTrip(false); setShowTip(false); setTipText(""); setReactionText(""); setGameOver(false); setGameOverReason("complete"); setTimeLeft(questionTime);
  }, [questionTime]);

  const handleChangeDifficulty = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setTerms(shuffleTerms(ANCHORING_TERMS)); setCurrentIdx(0); setScore(0); setStreak(0); setBestStreak(0); setTotalCorrect(0); setWrongCount(0); setSkippedCount(0);
    setSelected(null); setIsCorrect(null); setShowTrip(false); setShowTip(false); setTipText(""); setReactionText(""); setGameOver(false); setGameOverReason("complete"); setTimeLeft(10); setDifficulty(null);
  }, []);

  if (status === "loading") return <GameLoadingFallback />;

  if (!difficulty) {
    const difficulties: Record<string, DifficultyConfig> = {
      easy: { label: "Easy", time: "15 seconds", desc: "Take your time to find the right category" },
      medium: { label: "Medium", time: "10 seconds", desc: "A solid pace for sharpening your index skill" },
      hard: { label: "Hard", time: "5 seconds", desc: "Lightning fast — for those who know the NEC cold" },
    };
    return (
      <DifficultyPicker icon={Target} title="Anchoring" titleAccent="Index" subtitle="Match NEC field terms to their parent Index category. Choose your difficulty to begin." difficulties={difficulties} stats={stats}
        onSelect={(level) => { setDifficulty(level as Difficulty); setTimeLeft(DIFFICULTY_TIME[level as Difficulty]); setTerms(shuffleTerms(ANCHORING_TERMS)); }}
      />
    );
  }

  if (gameOver) {
    const answered = gameOverReason === "complete" ? terms.length : currentIdx + 1;
    const attempted = answered - skippedCount;
    const accuracy = attempted > 0 ? Math.round((totalCorrect / attempted) * 100) : 0;
    return (
      <GameOverScreen
        summaryTitle={gameOverReason === "strikes" ? "Circuit Overload!" : "Game Complete!"}
        summarySubtitle={gameOverReason === "strikes" ? `The breaker tripped ${MAX_WRONG} times \u2014 circuit shut down after ${answered} terms` : `You\u2019ve worked through all ${terms.length} terms`}
        sparkyMsg={gameOverReason === "strikes" ? "Too many trips! The breaker can only handle so much. Study the tips and try to keep the circuit running longer next time!" : accuracy >= 80 ? "Amazing work! You really know your way around the NEC Index. Keep it up!" : accuracy >= 50 ? "Good effort! Practice makes perfect \u2014 try again to improve your index navigation!" : "The NEC Index can be tricky. Review the tips and give it another shot \u2014 you'll get there!"}
        score={score} accuracy={accuracy} bestStreak={bestStreak} highScore={stats.highScore} skippedCount={skippedCount} gameOverReason={gameOverReason} maxWrong={MAX_WRONG} onPlayAgain={handleNewGame} onChangeDifficulty={handleChangeDifficulty}
      />
    );
  }

  const shouldShake = isCorrect === false && selected !== null;

  return (
    <motion.main animate={shouldShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }} key={`shake-${wrongCount}`} className="relative min-h-screen bg-cream dark:bg-stone-950">
      <BlueprintBackground />
      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10 flex flex-col">
        <GameHeader titleAccent="Index" title="Anchoring" subtitle="Match each NEC field term to its parent Index category. Build streaks to energize!" />

        <ScoreBar score={score} streak={streak} highScore={stats.highScore} timeLeft={timeLeft} maxTime={questionTime} wrongCount={wrongCount} maxWrong={MAX_WRONG} currentIdx={currentIdx} total={terms.length} onNewGame={handleNewGame} />

        <QuestionCard label="Field Term" energizeLevel={energizeLevel} currentIdx={currentIdx} isCorrect={isCorrect} reactionText={reactionText}>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">{currentTerm?.term}</p>
        </QuestionCard>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6 order-2 md:order-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ANCHOR_CATEGORIES.map((cat) => (
              <AnswerButton key={cat} value={cat} isSelected={selected === cat} isAnswer={currentTerm?.parent === cat} isCorrect={isCorrect} hasSelection={selected !== null} onClick={() => handleSelect(cat)} />
            ))}
          </div>
          {selected === null && <SkipButton onClick={handleSkip} remaining={MAX_SKIPS - skippedCount} />}
        </motion.div>

        <SparkyTip showTip={showTip} tipText={tipText} onContinue={advanceToNext} />
      </div>

      <AnimatePresence>
        {showTrip && currentTerm && (
          <TripOverlay term={currentTerm.term} tip={currentTerm.tip} strikeCount={wrongCount} maxStrikes={MAX_WRONG}
            onDismiss={() => { setShowTrip(false); if (wrongCount >= MAX_WRONG) { endGame("strikes"); } else { setTipText(currentTerm.tip); setShowTip(true); } }}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
