"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Gamepad2,
  Zap,
  Trophy,
  Check,
  X,
  Flame,
  Timer,
  ChevronUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = "quiz" | "games" | "rewards" | "leaderboard";

const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: "quiz", label: "Quizzes", icon: Brain },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "rewards", label: "Rewards", icon: Zap },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
];

const AUTO_ROTATE_MS = 4000;

/* ------------------------------------------------------------------ */
/*  Quiz Preview                                                       */
/* ------------------------------------------------------------------ */
function QuizPreview() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Question */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-amber/10 dark:bg-sparky-green/10 text-amber dark:text-sparky-green font-medium">
            Article 220
          </span>
          <span>Load Calculations</span>
        </div>
        <p className="text-sm md:text-base font-semibold text-foreground leading-snug">
          What is the demand factor for the first 10 kVA of receptacle load per
          NEC Table 220.44?
        </p>
      </div>

      {/* Answer options */}
      <div className="space-y-2">
        {[
          { text: "50%", correct: false, selected: false },
          { text: "80%", correct: false, selected: false },
          { text: "100%", correct: true, selected: true },
          { text: "125%", correct: false, selected: false },
        ].map((opt) => (
          <div
            key={opt.text}
            className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
              opt.selected && opt.correct
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border/50 dark:border-stone-800/50 text-muted-foreground"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                opt.selected && opt.correct
                  ? "bg-emerald-500 text-white"
                  : "border border-border dark:border-stone-700"
              }`}
            >
              {opt.selected && opt.correct && <Check className="h-3 w-3" />}
            </span>
            {opt.text}
          </div>
        ))}
      </div>

      {/* Watts earned toast */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 rounded-lg bg-amber/10 dark:bg-sparky-green/10 border border-amber/20 dark:border-sparky-green/20 px-3 py-2"
      >
        <Zap className="h-4 w-4 text-amber dark:text-sparky-green" />
        <span className="text-xs font-semibold text-amber dark:text-sparky-green">
          +208 Watts earned!
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          5 streak
        </span>
        <Flame className="h-3.5 w-3.5 text-orange-500" />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Games Preview                                                      */
/* ------------------------------------------------------------------ */
function GamesPreview() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Game header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Index Trace</p>
          <p className="text-xs text-muted-foreground">
            Match the NEC definition
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="font-semibold text-foreground">8</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span className="font-mono">07s</span>
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 rounded-full bg-border/50 dark:bg-stone-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-amber dark:bg-sparky-green"
          initial={{ width: "100%" }}
          animate={{ width: "70%" }}
          transition={{ duration: 2, ease: "linear" }}
        />
      </div>

      {/* Target definition */}
      <div className="rounded-lg bg-amber/5 dark:bg-sparky-green/5 border border-amber/10 dark:border-sparky-green/10 p-3">
        <p className="text-xs text-muted-foreground mb-1">Find the match:</p>
        <p className="text-sm font-medium text-foreground">
          &ldquo;A device intended for the protection of personnel that
          de-energizes a circuit when the current to ground exceeds a
          predetermined value.&rdquo;
        </p>
      </div>

      {/* Option grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { text: "GFCI", highlight: true },
          { text: "AFCI", highlight: false },
          { text: "Overcurrent Device", highlight: false },
          { text: "Disconnect", highlight: false },
        ].map((opt) => (
          <div
            key={opt.text}
            className={`rounded-lg border px-3 py-2.5 text-center text-xs font-medium transition-colors cursor-default ${
              opt.highlight
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "border-border/50 dark:border-stone-800/50 text-muted-foreground"
            }`}
          >
            {opt.text}
          </div>
        ))}
      </div>

      {/* Energize glow indicator */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i <= 4
                  ? "bg-amber dark:bg-sparky-green"
                  : "bg-border dark:bg-stone-800"
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Energize Level 4
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rewards Preview                                                    */
/* ------------------------------------------------------------------ */
function RewardsPreview() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Watts balance */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Watts Balance
          </p>
          <p className="text-3xl font-bold font-display text-amber dark:text-sparky-green">
            12,480
            <span className="text-base font-normal text-muted-foreground ml-1">
              W
            </span>
          </p>
        </div>
        <div className="w-14 h-14 rounded-xl bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center">
          <Zap className="h-7 w-7 text-amber dark:text-sparky-green" />
        </div>
      </div>

      {/* Voltage tier */}
      <div className="rounded-lg border border-border/50 dark:border-stone-800/50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            Voltage Tier
          </span>
          <span className="text-xs font-bold text-amber dark:text-sparky-green">
            277V — Master
          </span>
        </div>
        <div className="h-2 rounded-full bg-border/50 dark:bg-stone-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green/60 w-[72%]" />
        </div>
        <p className="text-[10px] text-muted-foreground">
          72% to 480V — Expert
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Streak", value: "14 days", icon: Flame, color: "text-orange-500" },
          { label: "Amps", value: "847", icon: Zap, color: "text-amber dark:text-sparky-green" },
          { label: "Rank", value: "#23", icon: Trophy, color: "text-purple-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border/50 dark:border-stone-800/50 p-2.5 text-center"
          >
            <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
            <p className="text-sm font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Classification */}
      <div className="flex items-center gap-2 rounded-lg bg-purple-500/5 border border-purple-500/10 px-3 py-2">
        <span className="text-base">⚡</span>
        <div>
          <p className="text-xs font-semibold text-foreground">
            Kilowatt Electrician
          </p>
          <p className="text-[10px] text-muted-foreground">
            Next: Megawatt at 1,000,000 W
          </p>
        </div>
        <ChevronUp className="h-4 w-4 text-purple-500 ml-auto" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Leaderboard Preview                                                */
/* ------------------------------------------------------------------ */
function LeaderboardPreview() {
  const leaders = [
    { rank: 1, name: "WiredWolf_TX", watts: "284,920", tier: "Transformer", badge: "🏆" },
    { rank: 2, name: "OhmRunner", watts: "241,305", tier: "Transformer", badge: "🥈" },
    { rank: 3, name: "CircuitQueen", watts: "198,740", tier: "Service Entrance", badge: "🥉" },
    { rank: 4, name: "VoltViper", watts: "156,221", tier: "Service Entrance", badge: "" },
    { rank: 5, name: "SparkMaster_99", watts: "134,810", tier: "Main Lug", badge: "" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-foreground">Global Rankings</p>
        <span className="text-xs text-muted-foreground">This Week</span>
      </div>

      {leaders.map((leader, i) => (
        <motion.div
          key={leader.rank}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
            leader.rank === 1
              ? "border-amber/30 dark:border-sparky-green/20 bg-amber/5 dark:bg-sparky-green/5"
              : "border-border/50 dark:border-stone-800/50"
          }`}
        >
          <span
            className={`w-6 text-center text-sm font-bold ${
              leader.rank <= 3
                ? "text-amber dark:text-sparky-green"
                : "text-muted-foreground"
            }`}
          >
            {leader.badge || leader.rank}
          </span>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800 flex items-center justify-center text-[10px] font-bold text-stone-500 dark:text-stone-400">
            {leader.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {leader.name}
            </p>
            <p className="text-[10px] text-muted-foreground">{leader.tier}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-amber dark:text-sparky-green">
              {leader.watts}
            </p>
            <p className="text-[10px] text-muted-foreground">Watts</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab content map                                                    */
/* ------------------------------------------------------------------ */
const tabContent: Record<Tab, React.FC> = {
  quiz: QuizPreview,
  games: GamesPreview,
  rewards: RewardsPreview,
  leaderboard: LeaderboardPreview,
};

/* ------------------------------------------------------------------ */
/*  Main Preview Component                                             */
/* ------------------------------------------------------------------ */
export function HeroPreview() {
  const [activeTab, setActiveTab] = useState<Tab>("quiz");
  const [paused, setPaused] = useState(false);

  // Auto-rotate tabs
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        const idx = tabs.findIndex((t) => t.id === prev);
        return tabs[(idx + 1) % tabs.length].id;
      });
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const ActiveContent = tabContent[activeTab];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Browser frame */}
      <div className="rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-950/80 shadow-xl dark:shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border dark:border-stone-800 bg-muted/50 dark:bg-stone-900/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background/80 dark:bg-stone-800/80 text-xs text-muted-foreground">
              <img
                src="/sparkypass-icon-orange.svg"
                alt=""
                className="w-3 h-3"
              />
              sparkypass.com
            </div>
          </div>
          <div className="w-[54px]" /> {/* Spacer to center URL bar */}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border dark:border-stone-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPaused(true);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative ${
                  isActive
                    ? "text-amber dark:text-sparky-green"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber dark:bg-sparky-green"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="min-h-[340px] md:min-h-[380px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <ActiveContent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        Interactive preview — hover to pause, click tabs to explore
      </p>
    </motion.div>
  );
}
