"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Loader2,
  Trophy,
  Zap,
  Flame,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  SkipForward,
  Timer,
  Lock,
  Check,
  Package,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { useSidebar } from "@/components/layout/SidebarContext";
import { haptic } from "@/lib/haptics";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GameStats {
  highScore: number;
  totalPlayed: number;
  totalCorrect: number;
}

// ─── localStorage helpers ───────────────────────────────────────────────────

export function loadStats(storageKey: string): GameStats {
  if (typeof window === "undefined")
    return { highScore: 0, totalPlayed: 0, totalCorrect: 0 };
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as GameStats;
  } catch {}
  return { highScore: 0, totalPlayed: 0, totalCorrect: 0 };
}

export function saveStats(storageKey: string, stats: GameStats) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(stats));
  } catch {}
}

// ─── Energize glow styles (streak-based) ────────────────────────────────────

export function getEnergizeStyles(level: number): string {
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

// ─── Award watts helper ─────────────────────────────────────────────────────

export async function awardWatts(
  activityType: string,
  answered: number,
  correct: number,
) {
  const wattsEarned = correct * 12;
  if (wattsEarned <= 0) return;
  try {
    const sessionRes = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionType: "quiz" }),
    });
    if (!sessionRes.ok) return;
    const { sessionId } = await sessionRes.json();
    const patchRes = await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        wattsEarned,
        activityType,
        questionsAnswered: answered,
        questionsCorrect: correct,
      }),
    });
    if (patchRes.ok) {
      const data = await patchRes.json();
      if (typeof data.wattsBalance === "number") {
        window.dispatchEvent(
          new CustomEvent("watts-updated", { detail: data.wattsBalance }),
        );
      }
    }
  } catch {
    // Silently fail
  }
}

// ─── Difficulty Picker ──────────────────────────────────────────────────────

export interface DifficultyConfig {
  label: string;
  time: string;
  desc: string;
  extra?: string;
}

export function DifficultyPicker({
  icon: Icon,
  title,
  titleAccent,
  subtitle,
  difficulties,
  stats,
  onSelect,
  extraContent,
}: {
  icon: LucideIcon;
  title: string;
  titleAccent: string;
  subtitle: string;
  difficulties: Record<string, DifficultyConfig>;
  stats: GameStats;
  onSelect: (level: string) => void;
  extraContent?: ReactNode;
}) {
  const levels = Object.keys(difficulties);
  const colorMap: Record<string, { color: string; border: string; bg: string }> = {
    easy: {
      color: "text-emerald-500 dark:text-emerald-400",
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      bg: "hover:bg-emerald-500/5",
    },
    medium: {
      color: "text-amber dark:text-amber",
      border: "border-amber/30 hover:border-amber/60",
      bg: "hover:bg-amber/5",
    },
    hard: {
      color: "text-red-500 dark:text-red-400",
      border: "border-red-500/30 hover:border-red-500/60",
      bg: "hover:bg-red-500/5",
    },
  };

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <BlueprintBackground />
      <div className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Icon className="h-12 w-12 text-amber dark:text-sparky-green mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
            <span className="text-amber dark:text-sparky-green">{titleAccent}</span> {title}
          </h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          {levels.map((level, i) => {
            const config = difficulties[level];
            const colors = colorMap[level] ?? colorMap.medium;

            return (
              <motion.button
                key={level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                onClick={() => onSelect(level)}
                className={`w-full text-left p-4 rounded-xl border ${colors.border} ${colors.bg} bg-card dark:bg-stone-900/50 transition-all cursor-pointer group`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-lg font-bold ${colors.color}`}>
                      {config.label}
                    </span>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {config.desc}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5" />
                      <span className="text-sm font-mono font-bold">
                        {config.time}
                      </span>
                    </div>
                    {config.extra && (
                      <span className="text-xs">{config.extra}</span>
                    )}
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

        {extraContent}
      </div>
    </main>
  );
}

// ─── Pack Shop ─────────────────────────────────────────────────────────────

import type { PackMeta, GameId } from "@/lib/game-packs";

export function PackShop({
  gameId,
  catalog,
  ownedPacks,
  wattsBalance,
  onPurchase,
}: {
  gameId: GameId;
  catalog: PackMeta[];
  ownedPacks: string[];
  wattsBalance: number;
  onPurchase: (packId: string) => void;
}) {
  const ownedSet = new Set(ownedPacks);

  if (catalog.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-amber dark:text-sparky-green" />
        <h2 className="text-lg font-bold font-display text-foreground">
          Expansion Packs
        </h2>
        <span className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-amber dark:text-sparky-green" />
          {wattsBalance}W
        </span>
      </div>
      <div className="grid gap-2">
        {catalog.map((pack) => {
          const owned = ownedSet.has(pack.id);
          const canAfford = wattsBalance >= pack.cost;

          return (
            <div
              key={pack.id}
              className={`flex items-center justify-between p-3 rounded-xl border bg-card dark:bg-stone-900/50 transition-all ${
                owned
                  ? "border-emerald-500/30 dark:border-sparky-green/30"
                  : "border-border dark:border-stone-800"
              }`}
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground truncate">
                    {pack.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {pack.cardCount} {pack.cardCount === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {pack.description}
                </p>
              </div>
              {owned ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 dark:text-sparky-green shrink-0">
                  <Check className="h-3.5 w-3.5" />
                  Owned
                </span>
              ) : (
                <Button
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => onPurchase(pack.id)}
                  className="shrink-0 bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 disabled:opacity-50"
                >
                  {canAfford ? (
                    <>
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      {pack.cost}W
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1" />
                      {pack.cost}W
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Score Bar ──────────────────────────────────────────────────────────────

export function ScoreBar({
  score,
  streak,
  highScore,
  timeLeft,
  maxTime,
  wrongCount,
  maxWrong,
  currentIdx,
  total,
  onNewGame,
  flameThreshold = 3,
  timerWarning = 3,
}: {
  score: number;
  streak: number;
  highScore: number;
  timeLeft: number;
  maxTime: number;
  wrongCount: number;
  maxWrong: number;
  currentIdx: number;
  total: number;
  onNewGame: () => void;
  flameThreshold?: number;
  timerWarning?: number;
}) {
  const circumference = 2 * Math.PI * 15;
  const timerProgress = maxTime > 0 ? timeLeft / maxTime : 0;
  const halfTime = Math.ceil(maxTime / 2);
  const timerStroke =
    timeLeft <= timerWarning
      ? "stroke-red-500"
      : timeLeft <= halfTime
        ? "stroke-amber"
        : "stroke-emerald-500 dark:stroke-sparky-green";
  const timerText =
    timeLeft <= timerWarning
      ? "text-red-500"
      : timeLeft <= halfTime
        ? "text-amber"
        : "text-emerald-500 dark:text-sparky-green";

  return (
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
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={score}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="text-xl font-bold text-amber dark:text-sparky-green"
                  >
                    {score}
                  </motion.p>
                </AnimatePresence>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="text-center">
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={streak}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="text-xl font-bold text-foreground flex items-center justify-center gap-1"
                  >
                    {streak}
                    {streak >= flameThreshold && (
                      <Flame className="h-4 w-4 text-orange-500" />
                    )}
                  </motion.p>
                </AnimatePresence>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-muted-foreground">
                  {highScore}
                </p>
                <p className="text-xs text-muted-foreground">Best</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Circular timer */}
              <div
                className={`relative w-10 h-10 ${timeLeft <= timerWarning ? "animate-pulse" : ""}`}
              >
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    strokeWidth="2"
                    className="stroke-muted-foreground/20"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={timerStroke}
                    strokeDasharray={`${timerProgress * circumference} ${circumference}`}
                    style={{
                      transition:
                        "stroke-dasharray 0.4s linear, stroke 0.3s ease",
                    }}
                  />
                </svg>
                <span
                  className={`absolute inset-0 flex items-center justify-center text-xs font-bold font-mono ${timerText}`}
                >
                  {timeLeft}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: maxWrong }).map((_, i) => (
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
                {currentIdx + 1}/{total}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onNewGame}
                className="border-border dark:border-stone-700"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                New Game
              </Button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-muted-foreground/10 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="h-full bg-amber/60 dark:bg-sparky-green/60 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentIdx + 1) / total) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Confetti helpers ────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#F59E0B", "#A3FF00", "#10B981"];

export function fireStreakConfetti() {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.7 },
    colors: CONFETTI_COLORS,
  });
}

export function fireCompletionConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: CONFETTI_COLORS,
  });
}

// ─── Finalize game (stats + confetti + watts) ────────────────────────────────

export function finalizeGame(opts: {
  storageKey: string;
  activityType: string;
  reason: "complete" | "strikes" | "timeout";
  currentStats: GameStats;
  score: number;
  totalCorrect: number;
  currentIdx: number;
  finalCorrect?: number;
}): GameStats {
  const correct = opts.finalCorrect ?? opts.totalCorrect;
  const answered = opts.currentIdx + (opts.reason === "complete" ? 1 : 0);
  const newStats: GameStats = {
    highScore: Math.max(opts.currentStats.highScore, opts.score),
    totalPlayed: opts.currentStats.totalPlayed + 1,
    totalCorrect: opts.currentStats.totalCorrect + correct,
  };
  saveStats(opts.storageKey, newStats);
  const accuracy = answered > 0 ? (correct / answered) * 100 : 0;
  if (opts.reason === "complete" && accuracy >= 70) {
    fireCompletionConfetti();
  }
  awardWatts(opts.activityType, answered, correct);
  return newStats;
}

// ─── Game Header (desktop only) ─────────────────────────────────────────────

export function GameHeader({
  titleAccent,
  title,
  subtitle,
}: {
  titleAccent: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-4 md:mb-6 md:order-1"
    >
      <h1 className="text-lg md:text-2xl lg:text-3xl font-bold font-display text-foreground mb-0.5 md:mb-1">
        <span className="text-amber dark:text-sparky-green">{titleAccent}</span>{" "}
        {title}
      </h1>
      <p className="text-muted-foreground text-xs md:text-sm hidden md:block">
        {subtitle}
      </p>
    </motion.div>
  );
}

// ─── Question Card (energize glow + AnimatePresence + CorrectFlash) ─────────

export function QuestionCard({
  label,
  energizeLevel,
  currentIdx,
  isCorrect,
  children,
  reactionText,
  className,
}: {
  label: string;
  energizeLevel: number;
  currentIdx: number;
  isCorrect: boolean | null;
  children: ReactNode;
  reactionText?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className={className ?? "mb-6 relative order-1 md:order-3"}
    >
      <Card
        className={`bg-card dark:bg-stone-900/50 transition-all duration-300 ${getEnergizeStyles(energizeLevel)}`}
      >
        <CardContent className="p-6 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {label}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {reactionText && (
              <motion.p
                key={reactionText}
                initial={{ opacity: 0, y: 8, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={`mt-3 text-sm font-bold ${
                  isCorrect === true
                    ? "text-emerald-500 dark:text-sparky-green"
                    : isCorrect === false
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              >
                {reactionText}
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      <CorrectFlash show={isCorrect === true} />
    </motion.div>
  );
}

// ─── Answer Button (correct/wrong styling + shake) ──────────────────────────

export function AnswerButton({
  value,
  isSelected,
  isAnswer,
  isCorrect,
  hasSelection,
  onClick,
  className,
}: {
  value: string;
  isSelected: boolean;
  isAnswer: boolean;
  isCorrect: boolean | null;
  hasSelection: boolean;
  onClick: () => void;
  className?: string;
}) {
  let btnClass =
    "border-border dark:border-stone-700 text-foreground hover:bg-muted";

  if (hasSelection) {
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
      animate={
        isSelected && !isCorrect
          ? { x: [0, -4, 4, -4, 4, 0] }
          : {}
      }
      transition={{ duration: 0.4 }}
      whileHover={!hasSelection ? { scale: 1.03 } : undefined}
      whileTap={!hasSelection ? { scale: 0.97 } : undefined}
    >
      <Button
        variant="outline"
        className={`w-full min-h-[44px] text-xs sm:text-sm transition-colors ${btnClass} ${className ?? ""}`}
        disabled={hasSelection}
        onClick={onClick}
      >
        {value}
      </Button>
    </motion.div>
  );
}

// ─── Blueprint grid background ──────────────────────────────────────────────

export function BlueprintBackground() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  );
}

// ─── Full-page loading fallback (for Suspense) ─────────────────────────────

export function GameLoadingFallback() {
  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <BlueprintBackground />
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </div>
    </main>
  );
}

// ─── 3-2-1 Countdown screen ────────────────────────────────────────────────

export function CountdownScreen({
  countdown,
  subtitle,
}: {
  countdown: number;
  subtitle: string;
}) {
  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <BlueprintBackground />
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
        <p className="text-muted-foreground text-sm mt-6">{subtitle}</p>
      </div>
    </main>
  );
}

// ─── Game HUD (score, streak, wrong indicators) ─────────────────────────────

export function GameHUD({
  score,
  streak,
  wrongCount,
  maxWrong,
}: {
  score: number;
  streak: number;
  wrongCount: number;
  maxWrong: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <Zap className="h-4 w-4 text-amber dark:text-sparky-green" />
        <span className="font-bold text-foreground">{score}</span>
      </div>
      <div className="flex items-center gap-1">
        <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
        <span className="font-bold text-foreground">{streak}</span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: maxWrong }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full border ${
              i < wrongCount
                ? "bg-red-500 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                : "bg-transparent border-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Correct flash overlay (green glow + bolt) ─────────────────────────────

export function CorrectFlash({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-xl pointer-events-none"
        >
          <div className="absolute inset-0 rounded-xl ring-2 ring-emerald-500 dark:ring-sparky-green shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 dark:bg-sparky-green"
          >
            <Zap className="h-4 w-4 text-white dark:text-stone-950" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Skip button ────────────────────────────────────────────────────────────

export const MAX_SKIPS = 3;

export function SkipButton({
  onClick,
  remaining,
}: {
  onClick: () => void;
  remaining: number;
}) {
  if (remaining <= 0) return null;
  return (
    <div className="flex justify-center mt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="text-muted-foreground hover:text-foreground"
      >
        <SkipForward className="h-4 w-4 mr-1" />
        Skip ({remaining})
      </Button>
    </div>
  );
}

// ─── Sparky tip (shown after wrong answer, before advancing) ────────────────

export function SparkyTip({
  tipText,
  showTip,
  onContinue,
  className,
}: {
  tipText: string;
  showTip: boolean;
  onContinue: () => void;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {showTip && tipText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={className ?? "mb-6 order-first md:order-5"}
        >
          <SparkyMessage size="medium" variant="thinking" message={tipText} />
          <div className="flex justify-center mt-4">
            <Button
              onClick={onContinue}
              className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Count-up number animation ──────────────────────────────────────────────

function CountUp({
  target,
  duration = 1000,
  delay = 0,
  suffix = "",
}: {
  target: number;
  duration?: number;
  delay?: number;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

// ─── Game Over screen ───────────────────────────────────────────────────────

export function GameOverScreen({
  summaryTitle,
  summarySubtitle,
  sparkyMsg,
  score,
  accuracy,
  bestStreak,
  highScore,
  skippedCount,
  gameOverReason,
  maxWrong,
  onPlayAgain,
  onChangeDifficulty,
}: {
  summaryTitle: string;
  summarySubtitle: string;
  sparkyMsg: string;
  score: number;
  accuracy: number;
  bestStreak: number;
  highScore: number;
  skippedCount: number;
  gameOverReason: "complete" | "strikes" | "timeout";
  maxWrong: number;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
}) {
  const countUpDelay = 500;
  const isNewRecord = score >= highScore && score > 0;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <BlueprintBackground />
      <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {/* Icon — bounce entrance */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 12,
          }}
          className="text-center mb-2"
        >
          {gameOverReason === "strikes" ? (
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          ) : (
            <Trophy className="h-16 w-16 text-amber dark:text-sparky-green mx-auto" />
          )}
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">
            {summaryTitle}
          </h1>
          <p className="text-muted-foreground">{summarySubtitle}</p>
        </motion.div>

        {/* Stats card with count-up */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800 mb-6">
            <CardContent className="p-6">
              <div
                className={`grid ${skippedCount > 0 ? "grid-cols-4" : "grid-cols-3"} gap-4 text-center`}
              >
                <div>
                  <p className="text-3xl font-bold text-amber dark:text-sparky-green tabular-nums">
                    <CountUp target={score} delay={countUpDelay} />
                  </p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald dark:text-sparky-green tabular-nums">
                    <CountUp
                      target={accuracy}
                      delay={countUpDelay + 100}
                      suffix="%"
                    />
                  </p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    <CountUp target={bestStreak} delay={countUpDelay + 200} />
                  </p>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                </div>
                {skippedCount > 0 && (
                  <div>
                    <p className="text-3xl font-bold text-muted-foreground tabular-nums">
                      <CountUp target={skippedCount} delay={countUpDelay + 300} />
                    </p>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                  </div>
                )}
              </div>
              {gameOverReason === "strikes" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-border dark:border-stone-800"
                >
                  {Array.from({ length: maxWrong }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-red-500 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    />
                  ))}
                  <span className="text-xs text-red-500 font-medium ml-2">
                    {maxWrong} strikes
                  </span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* High score in watts */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.4 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber dark:text-sparky-green" />
            <span className="text-2xl font-bold font-display tabular-nums text-amber dark:text-sparky-green">
              <CountUp target={highScore} delay={1500} suffix="W" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isNewRecord ? "New High Score!" : "High Score"}
          </p>
        </motion.div>

        {/* Action buttons — appear after stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.6 }}
          className="flex justify-center gap-3"
        >
          <Button
            onClick={onPlayAgain}
            className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
          <Button
            variant="outline"
            onClick={onChangeDifficulty}
            className="border-border dark:border-stone-700"
          >
            Change Difficulty
          </Button>
        </motion.div>

        {/* Sparky message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.8 }}
          className="mt-8"
        >
          <SparkyMessage size="medium" message={sparkyMsg} />
        </motion.div>
      </div>
    </main>
  );
}

// ─── Trip Overlay (circuit breaker animation on wrong answer) ───────────────

export function TripOverlay({
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
  const { collapsed } = useSidebar();

  const handleReset = () => {
    if (resetting) return;
    if (isFinalStrike) {
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

  // Smoke particles for final strike
  const smokeParticles = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 60,
      drift: (Math.random() - 0.5) * 60,
      size: 24 + Math.random() * 36,
      delay: 0.4 + i * 0.12 + Math.random() * 0.2,
      duration: 2.5 + Math.random() * 2,
      riseDistance: -100 - Math.random() * 100,
      opacity: 0.6 + Math.random() * 0.3,
    })),
  ).current;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1, 0, 0.5, 0] }}
        transition={{ duration: 0.8, times: [0, 0.1, 0.2, 0.3, 0.5, 0.8] }}
        className="fixed inset-0 bg-red-500/25 pointer-events-none"
      />

      <div
        className={`h-full flex items-center justify-center transition-[padding-left] duration-200 ${collapsed ? "xl:pl-[68px]" : "xl:pl-[240px]"}`}
      >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", bounce: 0.35 }}
        className="text-center p-6 max-w-xs"
      >
        {/* Circuit Breaker Icon */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative mx-auto mb-5"
          style={{ width: 140, height: 200 }}
        >
          {/* Smoke particles — final strike only, looping */}
          {isFinalStrike &&
            smokeParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 0, x: p.startX, scale: 0.2 }}
                animate={{
                  opacity: [0, p.opacity, p.opacity * 0.6, 0],
                  y: [
                    0,
                    p.riseDistance * 0.4,
                    p.riseDistance * 0.7,
                    p.riseDistance,
                  ],
                  x: [
                    p.startX,
                    p.startX + p.drift * 0.3,
                    p.startX + p.drift * 0.7,
                    p.startX + p.drift,
                  ],
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

          <svg
            viewBox="0 0 140 200"
            fill="none"
            className="w-full h-full drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            <rect
              x="24"
              y="12"
              width="92"
              height="176"
              rx="6"
              className="fill-stone-200 dark:fill-stone-700 stroke-stone-400 dark:stroke-stone-500"
              strokeWidth="3"
            />
            <rect
              x="14"
              y="40"
              width="14"
              height="20"
              rx="2"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500"
              strokeWidth="2.5"
            />
            <rect
              x="14"
              y="140"
              width="14"
              height="20"
              rx="2"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500"
              strokeWidth="2.5"
            />
            <rect
              x="112"
              y="40"
              width="14"
              height="20"
              rx="2"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500"
              strokeWidth="2.5"
            />
            <rect
              x="112"
              y="140"
              width="14"
              height="20"
              rx="2"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500"
              strokeWidth="2.5"
            />
            <circle
              cx="52"
              cy="42"
              r="10"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-500 dark:stroke-stone-400"
              strokeWidth="2.5"
            />
            <circle
              cx="52"
              cy="42"
              r="4"
              className="fill-stone-400 dark:fill-stone-500"
            />
            <circle
              cx="88"
              cy="42"
              r="10"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-500 dark:stroke-stone-400"
              strokeWidth="2.5"
            />
            <circle
              cx="88"
              cy="42"
              r="4"
              className="fill-stone-400 dark:fill-stone-500"
            />
            <rect
              x="42"
              y="70"
              width="56"
              height="80"
              rx="4"
              className="fill-stone-100 dark:fill-stone-800 stroke-stone-400 dark:stroke-stone-500"
              strokeWidth="2"
            />
            <rect
              x="50"
              y="78"
              width="40"
              height="64"
              rx="3"
              className="fill-stone-300 dark:fill-stone-600 stroke-stone-400 dark:stroke-stone-500"
              strokeWidth="1.5"
            />
          </svg>

          {/* Toggle handle */}
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
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
                <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
                <div className="w-4 h-0.5 rounded-full bg-stone-400/80 dark:bg-stone-600/80" />
              </div>
            </div>
          </motion.div>

          {/* TRIPPED label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={resetting ? { opacity: 0 } : { opacity: 1 }}
            transition={
              resetting ? { duration: 0.1 } : { delay: 0.55, duration: 0.3 }
            }
            className="absolute left-0 right-0 bottom-6 text-center"
          >
            <span className="text-[11px] font-black tracking-[0.2em] text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              TRIPPED
            </span>
          </motion.div>

          {/* Spark burst */}
          {[...Array(6)].map((_, i) => {
            const angle = i * 60 * (Math.PI / 180);
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
      </div>
    </motion.div>
  );
}
