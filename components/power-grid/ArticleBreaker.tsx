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
    textColor: string;
    subTextColor: string;
  }
> = {
  energized: {
    bg: "bg-emerald/8 dark:bg-sparky-green/8",
    border: "border-emerald/50 dark:border-sparky-green/40 hover:border-emerald/70 dark:hover:border-sparky-green/60",
    indicator: "bg-emerald dark:bg-sparky-green",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.35)] dark:shadow-[0_0_12px_rgba(163,255,0,0.25)]",
    icon: Zap,
    iconColor: "text-emerald dark:text-sparky-green",
    label: "Energized",
    textColor: "text-foreground",
    subTextColor: "text-muted-foreground",
  },
  "browned-out": {
    bg: "bg-amber/8",
    border: "border-amber/50 hover:border-amber/70",
    indicator: "bg-amber",
    glow: "shadow-[0_0_10px_rgba(245,158,11,0.2)]",
    icon: AlertTriangle,
    iconColor: "text-amber",
    label: "Browned Out",
    textColor: "text-foreground",
    subTextColor: "text-muted-foreground",
  },
  flickering: {
    bg: "bg-amber/6",
    border: "border-amber/40 hover:border-amber/60",
    indicator: "bg-amber animate-pulse",
    glow: "",
    icon: AlertTriangle,
    iconColor: "text-amber",
    label: "Flickering",
    textColor: "text-foreground",
    subTextColor: "text-muted-foreground",
  },
  "de-energized": {
    bg: "bg-muted/20",
    border: "border-stone-300/50 dark:border-stone-800/60 hover:border-stone-400/60 dark:hover:border-stone-700/60",
    indicator: "bg-stone-400 dark:bg-stone-600",
    glow: "",
    icon: ZapOff,
    iconColor: "text-stone-400 dark:text-stone-600",
    label: "De-energized",
    textColor: "text-muted-foreground",
    subTextColor: "text-muted-foreground/60",
  },
};

// Framer Motion animate props per status
function getStatusAnimation(status: PowerGridStatus) {
  switch (status) {
    case "energized":
      return {
        animate: { opacity: 1, y: 0, scale: 1 },
      };
    case "browned-out":
      return {
        animate: { opacity: 1, y: 0, scale: 1 },
      };
    case "flickering":
      return {
        animate: { opacity: [1, 0.7, 1, 0.85, 1], y: 0, scale: 1 },
        transition: { opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
      };
    case "de-energized":
      return {
        animate: { opacity: 0.6, y: 0, scale: 1 },
      };
  }
}

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
  const statusAnim = getStatusAnimation(status);

  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={statusAnim.animate}
      transition={{
        duration: 0.4,
        delay: 0.05 + index * 0.03,
        ...("transition" in statusAnim ? statusAnim.transition : {}),
      }}
      whileHover={status === "de-energized" ? { opacity: 0.75, scale: 1.01 } : { scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full text-left rounded-lg border p-4 transition-colors cursor-pointer overflow-hidden ${config.bg} ${config.border} ${config.glow}`}
    >
      {/* Energized: subtle animated green glow overlay */}
      {status === "energized" && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none bg-emerald/3 dark:bg-sparky-green/3"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Browned-out: dim amber wash */}
      {status === "browned-out" && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none bg-amber/3"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Flickering: rapid flash overlay */}
      {status === "flickering" && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none bg-amber/5"
          animate={{ opacity: [0, 0.6, 0, 0.3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Header row */}
      <div className="relative flex items-center gap-3 mb-2">
        {/* Breaker switch visual */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-3 h-8 rounded-sm transition-colors ${
              status === "de-energized"
                ? "bg-stone-300 dark:bg-stone-700"
                : status === "energized"
                  ? "bg-emerald dark:bg-sparky-green"
                  : "bg-amber"
            }`}
          />
          {/* Energized: steady glow on breaker switch */}
          {status === "energized" && (
            <motion.div
              className="absolute inset-0 w-3 h-8 rounded-sm bg-emerald/40 dark:bg-sparky-green/40"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          {/* Flickering: irregular flash on breaker switch */}
          {status === "flickering" && (
            <motion.div
              className="absolute inset-0 w-3 h-8 rounded-sm bg-amber"
              animate={{ opacity: [1, 0.2, 0.8, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          )}
          {/* Browned-out: slow dim pulse on breaker switch */}
          {status === "browned-out" && (
            <motion.div
              className="absolute inset-0 w-3 h-8 rounded-sm bg-amber/50"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm truncate ${config.textColor}`}>{name}</h3>
          <p className={`text-xs ${config.subTextColor}`}>{necArticle}</p>
        </div>

        {/* Status icon with animation */}
        {status === "energized" ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
          </motion.div>
        ) : status === "flickering" ? (
          <motion.div
            animate={{ opacity: [1, 0.3, 1, 0.5, 1], rotate: [0, -5, 5, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
          </motion.div>
        ) : (
          <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
        )}
      </div>

      {/* Status label badge */}
      <div className="relative mb-2">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            status === "energized"
              ? "bg-emerald/15 dark:bg-sparky-green/15 text-emerald dark:text-sparky-green"
              : status === "browned-out"
                ? "bg-amber/15 text-amber"
                : status === "flickering"
                  ? "bg-amber/15 text-amber"
                  : "bg-stone-200/50 dark:bg-stone-800/50 text-stone-400 dark:text-stone-600"
          }`}
        >
          {status === "flickering" && (
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full bg-amber"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          {status === "energized" && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald dark:bg-sparky-green" />
          )}
          {status === "browned-out" && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber" />
          )}
          {config.label}
        </span>
      </div>

      {/* Stats row */}
      <div className={`relative flex items-center gap-3 text-xs ${status === "de-energized" ? "opacity-60" : ""}`}>
        {totalAnswered > 0 ? (
          <>
            <span className={`font-bold ${config.iconColor}`}>{accuracy}%</span>
            <span className={config.subTextColor}>{totalAnswered} Qs</span>
            {srsHealth > 0 && (
              <span className={`flex items-center gap-0.5 ${config.subTextColor}`}>
                <TrendingUp className="h-3 w-3" />
                {srsHealth}% SRS
              </span>
            )}
          </>
        ) : (
          <span className={`italic ${config.subTextColor}`}>Not started</span>
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
        <div className={`relative mt-2 h-1.5 rounded-full overflow-hidden ${
          status === "de-energized"
            ? "bg-stone-300/40 dark:bg-stone-800/40"
            : "bg-stone-200 dark:bg-stone-800"
        }`}>
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
          {/* Energized: shimmer on progress bar */}
          {status === "energized" && accuracy > 0 && (
            <motion.div
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ left: ["-10%", "110%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
            />
          )}
        </div>
      )}
    </motion.button>
  );
}
