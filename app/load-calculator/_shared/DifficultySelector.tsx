"use client";

import { motion } from "framer-motion";
import { Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "./types";

export function DifficultySelector({
  onSelect,
}: {
  onSelect: (difficulty: DifficultyLevel) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground mb-4">
        Choose your difficulty level to get started.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DIFFICULTY_LEVELS.map((level) => (
          <Card
            key={level.id}
            className={`cursor-pointer hover:shadow-md transition-all duration-300 pressable border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 ${
              level.id === "beginner"
                ? "hover:border-emerald/50 dark:hover:border-sparky-green/50"
                : "hover:border-amber/50"
            } hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]`}
            onClick={() => onSelect(level.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  level.id === "beginner" ? "bg-emerald/10 dark:bg-sparky-green/10" : "bg-amber/10"
                }`}>
                  <Zap className={`h-5 w-5 ${
                    level.id === "beginner" ? "text-emerald dark:text-sparky-green" : "text-amber"
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold">{level.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {level.description}
                  </p>
                </div>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 mt-3">
                {level.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className={`h-3 w-3 ${
                      level.id === "beginner" ? "text-emerald dark:text-sparky-green" : "text-amber"
                    }`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
