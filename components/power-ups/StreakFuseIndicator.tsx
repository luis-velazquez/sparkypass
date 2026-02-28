"use client";

import { Shield } from "lucide-react";

interface StreakFuseIndicatorProps {
  expiresAt: string | null;
}

export function StreakFuseIndicator({ expiresAt }: StreakFuseIndicatorProps) {
  if (!expiresAt) return null;

  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const timeLeft = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber dark:text-sparky-green">
      <Shield className="h-3.5 w-3.5" />
      <span className="font-medium">Fuse active</span>
      <span className="text-muted-foreground">({timeLeft})</span>
    </div>
  );
}
