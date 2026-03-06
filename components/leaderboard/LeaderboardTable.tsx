"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Medal, Award } from "lucide-react";
import { TierBadge } from "./TierBadge";
import type { LeaderboardEntry } from "@/app/api/leaderboard/route";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-stone-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Add friends to see the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.userId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            entry.isCurrentUser
              ? "bg-amber/10 dark:bg-sparky-green/10 border border-amber/30 dark:border-sparky-green/20"
              : "bg-card dark:bg-stone-900/50 border border-border dark:border-stone-800"
          }`}
        >
          {/* Rank */}
          <div className="flex-shrink-0 w-8 flex justify-center">
            <RankIcon rank={entry.rank} />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm truncate ${entry.isCurrentUser ? "text-amber dark:text-sparky-green" : "text-foreground"}`}>
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">(you)</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{entry.classificationTitle}</span>
              {entry.studyStreak > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-orange-500">
                  <Flame className="h-3 w-3" />
                  {entry.studyStreak}
                </span>
              )}
            </div>
          </div>

          {/* Tier badge */}
          <TierBadge tier={entry.leaderboardTier} />

          {/* Watts */}
          <div className="text-right flex-shrink-0">
            <p className={`text-sm font-bold font-mono ${entry.isCurrentUser ? "text-amber dark:text-sparky-green" : "text-foreground"}`}>
              {entry.wattsLifetime.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Watts</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
