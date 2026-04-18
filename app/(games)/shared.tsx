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
  Unlock,
  Check,
  Package,
  Lightbulb,
  Snowflake,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import { useSidebar } from "@/components/layout/SidebarContext";
import { haptic } from "@/lib/haptics";

// ─── Card Game Rules (shared by Index Sniper & Translation Engine) ──────────

export const CARD_GAME_RULES = {
  MAX_WRONG: 3,
  DIFFICULTY_TIME: { easy: 20, medium: 10, hard: 5 } as const,
  DIFFICULTY_OPTIONS: { easy: 4, medium: 8, hard: 12 } as const,
} as const;

/** Correct-answer threshold to unlock the next pack via mastery */
export const MASTERY_CORRECT_THRESHOLD = 15;

export type CardGameDifficulty = keyof typeof CARD_GAME_RULES.DIFFICULTY_TIME;

// ─── Combo Multiplier ────────────────────────────────────────────────────────

export const COMBO_THRESHOLDS = [
  { streak: 0, multiplier: 1 },
  { streak: 5, multiplier: 2 },
  { streak: 10, multiplier: 3 },
  { streak: 15, multiplier: 4 },
] as const;

export function getComboMultiplier(streak: number): number {
  for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
    if (streak >= COMBO_THRESHOLDS[i].streak) return COMBO_THRESHOLDS[i].multiplier;
  }
  return 1;
}

// ─── Wildcards (earned through streaks) ──────────────────────────────────────

export type WildcardType = "freeze_timer" | "extra_life";

export interface WildcardInventory {
  freeze_timer: number;
  extra_life: number;
}

/** Streaks at which wildcards are awarded */
export const WILDCARD_AWARDS: { streak: number; type: WildcardType }[] = [
  { streak: 7, type: "freeze_timer" },
  { streak: 12, type: "extra_life" },
  { streak: 18, type: "freeze_timer" },
  { streak: 25, type: "extra_life" },
];

/** Check if a new streak just earned a wildcard */
export function checkWildcardEarned(newStreak: number): WildcardType | null {
  const award = WILDCARD_AWARDS.find((a) => a.streak === newStreak);
  return award?.type ?? null;
}

const WILDCARD_CONFIG: Record<WildcardType, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  freeze_timer: { icon: Snowflake, label: "Freeze", color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/30" },
  extra_life: { icon: Heart, label: "Extra Life", color: "text-pink-400", bg: "bg-pink-400/10 border-pink-400/30" },
};

export function WildcardBar({
  wildcards,
  onUse,
  disabled,
}: {
  wildcards: WildcardInventory;
  onUse: (type: WildcardType) => void;
  disabled?: boolean;
}) {
  const entries = (Object.entries(wildcards) as [WildcardType, number][]).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {entries.map(([type, count]) => {
        const config = WILDCARD_CONFIG[type];
        const Icon = config.icon;
        return (
          <motion.button
            key={type}
            whileHover={!disabled ? { scale: 1.08 } : undefined}
            whileTap={!disabled ? { scale: 0.92 } : undefined}
            onClick={() => !disabled && onUse(type)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default ${config.bg}`}
          >
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            <span className={config.color}>{config.label}</span>
            {count > 1 && <span className="text-muted-foreground">×{count}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}

/** Toast notification when a wildcard is earned */
export function WildcardEarnedToast({ type }: { type: WildcardType | null }) {
  const config = type ? WILDCARD_CONFIG[type] : null;

  return (
    <AnimatePresence>
      {type && config && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg ${config.bg} bg-card dark:bg-stone-900`}>
            <config.icon className={`h-5 w-5 ${config.color}`} />
            <span className="text-sm font-bold text-foreground">{config.label} earned!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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

export const WATTS_PER_CORRECT = 50;

export async function awardWatts(
  activityType: string,
  answered: number,
  correct: number,
) {
  const wattsEarned = correct * WATTS_PER_CORRECT;
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
  multiplier = 1,
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
  multiplier?: number;
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
              {multiplier > 1 && (
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={multiplier}
                    initial={{ scale: 1.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className="text-center"
                  >
                    <p className={`text-lg font-black font-mono ${
                      multiplier >= 4 ? "text-red-500" : multiplier >= 3 ? "text-orange-500" : "text-amber dark:text-sparky-green"
                    }`}>
                      ×{multiplier}
                    </p>
                    <p className="text-xs text-muted-foreground">Combo</p>
                  </motion.div>
                </AnimatePresence>
              )}
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

// ─── Question Card (3D flip with trip feedback on back) ──────────────────────

export interface TripInfo {
  term: string;
  tip: string;
  strikeCount: number;
  maxStrikes: number;
}

export const CONTINUE_COST = 1000;
export const HINT_COST = 100;

export function QuestionCard({
  label,
  energizeLevel,
  currentIdx,
  isCorrect,
  children,
  className,
  flipped,
  tripInfo,
  onTripDismiss,
  canContinue,
  onContinueGame,
}: {
  label: string;
  energizeLevel: number;
  currentIdx: number;
  isCorrect: boolean | null;
  children: ReactNode;
  className?: string;
  flipped?: boolean;
  tripInfo?: TripInfo;
  onTripDismiss?: () => void;
  canContinue?: boolean;
  onContinueGame?: () => void;
}) {
  const isFinalStrike = tripInfo ? tripInfo.strikeCount >= tripInfo.maxStrikes : false;

  // Haptic on flip
  useEffect(() => {
    if (!flipped) return;
    haptic(isFinalStrike ? "error" : "medium");
  }, [flipped, isFinalStrike]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className={className ?? "mb-6 relative order-1 md:order-3"}
      style={{ perspective: 900 }}
    >
      <motion.div
        animate={{ rotateX: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* ── Front face ── */}
        <div style={{ backfaceVisibility: "hidden" }}>
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
            </CardContent>
          </Card>
          <CorrectFlash show={isCorrect === true} />
        </div>

        {/* ── Back face (trip feedback) ── */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
        >
          <Card
            className={`h-full border-2 ${
              isFinalStrike
                ? "border-red-500/60 bg-red-50 dark:bg-red-950/95"
                : "border-red-500/30 bg-card dark:bg-stone-900/95"
            }`}
          >
            <CardContent className="p-6 text-center">
              {tripInfo && (
                <>
                  {/* Strike dots + label */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                        {isFinalStrike ? "Circuit Overload" : "Tripped"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: tripInfo.maxStrikes }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-full border ${
                            i < tripInfo.strikeCount
                              ? "bg-red-500 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                              : "bg-transparent border-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Term + tip */}
                  <p className="text-foreground text-sm font-medium mb-1">
                    &ldquo;{tripInfo.term}&rdquo;
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                    {tripInfo.tip}
                  </p>

                  {/* Action buttons */}
                  {isFinalStrike && canContinue && onContinueGame ? (
                    <div className="flex gap-2">
                      <button
                        onClick={onContinueGame}
                        className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-amber hover:bg-amber/90 text-white border border-amber dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 dark:border-sparky-green"
                      >
                        Continue ({CONTINUE_COST}W)
                      </button>
                      <button
                        onClick={onTripDismiss}
                        className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-red-500 hover:bg-red-600 text-white border border-red-600 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 dark:border-red-500/30"
                      >
                        Game Over
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onTripDismiss}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        isFinalStrike
                          ? "bg-red-500 hover:bg-red-600 text-white border border-red-600 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 dark:border-red-500/30"
                          : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                      }`}
                    >
                      {isFinalStrike ? "Game Over" : "Continue"}
                    </button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Answer Button (correct/wrong styling + shake) ──────────────────────────

function answerTextClass(text: string): string {
  const len = text.length;
  if (len > 50) return "text-[10px] sm:text-xs leading-tight";
  if (len > 30) return "text-[11px] sm:text-xs leading-snug";
  return "text-xs sm:text-sm";
}

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
        className={`w-full min-h-[44px] whitespace-normal text-wrap py-2 px-2.5 transition-colors ${answerTextClass(value)} ${btnClass} ${className ?? ""}`}
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
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground"
    >
      <SkipForward className="h-4 w-4 mr-1" />
      Skip ({remaining})
    </Button>
  );
}

export function HintButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="text-amber dark:text-sparky-green hover:text-amber/80 dark:hover:text-sparky-green/80 disabled:opacity-40"
    >
      <Lightbulb className="h-4 w-4 mr-1" />
      Hint ({HINT_COST}W)
    </Button>
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

export interface MasteryUnlock {
  packName: string;
  cardCount: number;
}

export interface MasteryProgress {
  unlockedIndex: number;
  totalPacks: number;
  bestCorrect: number;
  threshold: number;
}

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
  wattsEarned = 0,
  wattsSpent = 0,
  newUnlock,
  masteryProgress,
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
  wattsEarned?: number;
  wattsSpent?: number;
  newUnlock?: MasteryUnlock | null;
  masteryProgress?: MasteryProgress | null;
}) {
  const countUpDelay = 500;
  const isNewRecord = score >= highScore && score > 0;
  const wattsNet = wattsEarned - wattsSpent;

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

        {/* Watts earned / spent summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.4 }}
          className="mb-6"
        >
          <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-500 dark:text-sparky-green tabular-nums">
                      +<CountUp target={wattsEarned} delay={1500} />
                    </p>
                    <p className="text-xs text-muted-foreground">Earned</p>
                  </div>
                  {wattsSpent > 0 && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-500 tabular-nums">
                        −<CountUp target={wattsSpent} delay={1600} />
                      </p>
                      <p className="text-xs text-muted-foreground">Spent</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className={`h-5 w-5 ${wattsNet >= 0 ? "text-amber dark:text-sparky-green" : "text-red-500"}`} />
                  <span className={`text-2xl font-bold font-display tabular-nums ${wattsNet >= 0 ? "text-amber dark:text-sparky-green" : "text-red-500"}`}>
                    {wattsNet >= 0 ? "+" : "−"}<CountUp target={Math.abs(wattsNet)} delay={1700} suffix="W" />
                  </span>
                </div>
              </div>
              {isNewRecord && (
                <p className="text-xs text-amber dark:text-sparky-green font-bold text-center mt-2 pt-2 border-t border-border dark:border-stone-800">
                  New High Score!
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pack unlocked banner */}
        {newUnlock && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1.6 }}
            className="mb-6"
          >
            <Card className="border-amber/40 dark:border-sparky-green/30 bg-amber/5 dark:bg-sparky-green/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber/20 dark:bg-sparky-green/20 shrink-0">
                  <Unlock className="h-5 w-5 text-amber dark:text-sparky-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Pack Unlocked!</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-amber dark:text-sparky-green">{newUnlock.packName}</span> — {newUnlock.cardCount} new cards added to your pool
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Mastery progress bar (when no unlock happened) */}
        {!newUnlock && masteryProgress && masteryProgress.unlockedIndex < masteryProgress.totalPacks - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.6 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Next pack unlock</span>
              <span className="font-mono font-bold">{masteryProgress.bestCorrect}/{masteryProgress.threshold} correct</span>
            </div>
            <div className="h-2 bg-muted-foreground/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber/60 dark:bg-sparky-green/60 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((masteryProgress.bestCorrect / masteryProgress.threshold) * 100, 100)}%` }}
                transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* Action buttons — appear after stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: newUnlock ? 1.8 : 1.6 }}
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

