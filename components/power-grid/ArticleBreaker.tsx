"use client";

import { motion } from "framer-motion";
import {
  Zap,
  ZapOff,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Flame,
} from "lucide-react";
import type { PowerGridStatus } from "@/app/api/power-grid/route";

interface ArticleBreakerProps {
  slug: string;
  name: string;
  necArticle: string;
  status: PowerGridStatus;
  accuracy: number;
  totalAnswered: number;
  srsHealth: number;
  srsDue: number;
  bestStreak: number;
  breakerTripped: boolean;
  onClick?: () => void;
  index: number;
}

const statusConfig: Record<
  PowerGridStatus,
  {
    bg: string;
    border: string;
    indicator: string;
    glow: string;
    icon: typeof Zap;
    iconColor: string;
    label: string;
  }
> = {
  energized: {
    bg: "bg-emerald/5 dark:bg-sparky-green/5",
    border: "border-emerald/40 dark:border-sparky-green/30 hover:border-emerald/60 dark:hover:border-sparky-green/50",
    indicator: "bg-emerald dark:bg-sparky-green",
    glow: "shadow-[0_0_8px_rgba(16,185,129,0.3)] dark:shadow-[0_0_8px_rgba(163,255,0,0.2)]",
    icon: Zap,
    iconColor: "text-emerald dark:text-sparky-green",
    label: "Energized",
  },
  "browned-out": {
    bg: "bg-amber/5",
    border: "border-amber/40 hover:border-amber/60",
    indicator: "bg-amber",
    glow: "",
    icon: AlertTriangle,
    iconColor: "text-amber",
    label: "Browned Out",
  },
  flickering: {
    bg: "bg-amber/5",
    border: "border-amber/40 hover:border-amber/60",
    indicator: "bg-amber animate-pulse",
    glow: "",
    icon: AlertTriangle,
    iconColor: "text-amber",
    label: "Flickering",
  },
  "de-energized": {
    bg: "bg-muted/30",
    border: "border-border dark:border-stone-800 hover:border-muted-foreground/40",
    indicator: "bg-stone-400 dark:bg-stone-600",
    glow: "",
    icon: ZapOff,
    iconColor: "text-muted-foreground",
    label: "De-energized",
  },
};

export function ArticleBreaker({
  slug,
  name,
  necArticle,
  status,
  accuracy,
  totalAnswered,
  srsHealth,
  srsDue,
  bestStreak,
  breakerTripped,
  onClick,
  index,
}: ArticleBreakerProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 + index * 0.03 }}
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all pressable cursor-pointer ${config.bg} ${config.border} ${config.glow}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-2">
        {/* Breaker switch visual */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-3 h-8 rounded-sm ${
              status === "de-energized"
                ? "bg-stone-300 dark:bg-stone-700"
                : status === "energized"
                  ? "bg-emerald dark:bg-sparky-green"
                  : "bg-amber"
            }`}
          />
          {status === "flickering" && (
            <motion.div
              className="absolute inset-0 w-3 h-8 rounded-sm bg-amber"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-foreground truncate">{name}</h3>
          <p className="text-xs text-muted-foreground">{necArticle}</p>
        </div>

        <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs">
        {totalAnswered > 0 ? (
          <>
            <span className={`font-bold ${config.iconColor}`}>{accuracy}%</span>
            <span className="text-muted-foreground">{totalAnswered} Qs</span>
            {srsHealth > 0 && (
              <span className="text-muted-foreground flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {srsHealth}% SRS
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground italic">Not started</span>
        )}
        {bestStreak > 0 && (
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <Flame className="h-3 w-3 text-orange-500" />
            {bestStreak}
          </span>
        )}
        {breakerTripped && (
          <ShieldAlert className="h-3.5 w-3.5 text-red-500 ml-auto" />
        )}
      </div>

      {/* Mini progress bar */}
      {totalAnswered > 0 && (
        <div className="mt-2 h-1 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.8, delay: 0.2 + index * 0.03 }}
            className={`h-full rounded-full ${
              status === "energized"
                ? "bg-emerald dark:bg-sparky-green"
                : status === "de-energized"
                  ? "bg-stone-400 dark:bg-stone-600"
                  : "bg-amber"
            }`}
          />
        </div>
      )}
    </motion.button>
  );
}
