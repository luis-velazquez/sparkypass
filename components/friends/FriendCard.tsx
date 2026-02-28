"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/leaderboard/TierBadge";

function getLeaderboardTier(wattsLifetime: number): string {
  if (wattsLifetime >= 100_000) return "The Transformer";
  if (wattsLifetime >= 25_000) return "Service Entrance";
  if (wattsLifetime >= 5_000) return "Main Lug";
  return "Sub-Panel";
}

interface FriendCardProps {
  friendshipId: string;
  name: string;
  username: string | null;
  wattsLifetime: number;
  tierTitle: string;
  tierVoltage: string;
  studyStreak: number;
  since: string | null;
  onRemove: () => void;
  index: number;
}

export function FriendCard({
  friendshipId,
  name,
  username,
  wattsLifetime,
  tierTitle,
  tierVoltage,
  studyStreak,
  since,
  onRemove,
  index,
}: FriendCardProps) {
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }

    setRemoving(true);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRemove();
      }
    } catch {
      // Silently fail
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-3 p-4 rounded-lg border border-border dark:border-stone-800 bg-card dark:bg-stone-900/50"
    >
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-amber dark:text-sparky-green">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-foreground truncate">{name}</span>
          {username && (
            <span className="text-xs text-muted-foreground">@{username}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">{tierVoltage} {tierTitle}</span>
          <TierBadge tier={getLeaderboardTier(wattsLifetime)} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {studyStreak > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-orange-500">
            <Flame className="h-3 w-3" />
            {studyStreak}
          </span>
        )}
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
          <Zap className="h-3 w-3 text-amber dark:text-sparky-green fill-current" />
          {wattsLifetime.toLocaleString()}
        </span>
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        disabled={removing}
        className={`h-8 px-2 ${confirmRemove ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}`}
      >
        {removing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : confirmRemove ? (
          <span className="text-xs">Confirm</span>
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </Button>
    </motion.div>
  );
}
