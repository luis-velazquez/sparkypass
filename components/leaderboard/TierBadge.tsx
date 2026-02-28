"use client";

import { Zap } from "lucide-react";

const TIER_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  "Sub-Panel": {
    color: "text-stone-500 dark:text-stone-400",
    bg: "bg-stone-100 dark:bg-stone-800",
    icon: "text-stone-400",
  },
  "Main Lug": {
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950",
    icon: "text-sky-500",
  },
  "Service Entrance": {
    color: "text-amber dark:text-amber-light",
    bg: "bg-amber/10 dark:bg-amber/15",
    icon: "text-amber",
  },
  "The Transformer": {
    color: "text-purple dark:text-purple-light",
    bg: "bg-purple/10 dark:bg-purple/15",
    icon: "text-purple dark:text-purple-light",
  },
};

interface TierBadgeProps {
  tier: string;
  size?: "sm" | "md";
}

export function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG["Sub-Panel"];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bg} ${config.color} ${
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      }`}
    >
      <Zap className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} ${config.icon} fill-current`} />
      {tier}
    </span>
  );
}
