"use client";

import { Shield, FileText } from "lucide-react";
import { getPowerUpName } from "@/lib/power-ups";
import type { PowerUpTypeValue } from "@/lib/db/schema";

interface ActivePowerUp {
  id: string;
  type: PowerUpTypeValue;
  expiresAt: string | null;
}

interface ActivePowerUpBannerProps {
  activePowerUps: ActivePowerUp[];
}

const ICON_MAP: Record<string, typeof Shield> = {
  streak_fuse: Shield,
  formula_sheet: FileText,
};

export function ActivePowerUpBanner({ activePowerUps }: ActivePowerUpBannerProps) {
  if (activePowerUps.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activePowerUps.map((powerUp) => {
        const Icon = ICON_MAP[powerUp.type] || Shield;
        const name = getPowerUpName(powerUp.type);

        let timeLeft = "";
        if (powerUp.expiresAt) {
          const remaining = new Date(powerUp.expiresAt).getTime() - Date.now();
          if (remaining > 0) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            timeLeft = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
          }
        }

        return (
          <div
            key={powerUp.id}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber/10 dark:bg-sparky-green/10 text-amber dark:text-sparky-green border border-amber/20 dark:border-sparky-green/15"
          >
            <Icon className="h-3 w-3" />
            <span className="font-medium">{name}</span>
            {timeLeft && (
              <span className="text-amber/70 dark:text-sparky-green/70">
                ({timeLeft})
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
