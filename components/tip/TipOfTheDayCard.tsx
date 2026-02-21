"use client";

import { useEffect, useState } from "react";
import { Lightbulb, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { getTodaysTip, TIP_ENABLED_KEY } from "@/lib/tips";

export function TipOfTheDayCard() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const tip = getTodaysTip();

  useEffect(() => {
    const stored = localStorage.getItem(TIP_ENABLED_KEY);
    if (stored === "false") setEnabled(false);
    setMounted(true);
  }, []);

  if (!mounted || !enabled) return null;

  return (
    <Card
      className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/25 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.06)] cursor-pointer"
      onClick={() => setCollapsed(!collapsed)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber/20 dark:bg-sparky-green/20 dark:shadow-[0_0_15px_rgba(163,255,0,0.35)] flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-amber dark:text-sparky-green" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Tip of the Day
            </span>
            {collapsed && (
              <span className="text-sm font-semibold text-foreground ml-1 truncate">
                — {tip.title}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-amber/10 dark:bg-sparky-green/10 text-amber dark:text-sparky-green font-medium">
                  {tip.category}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold ${
                  tip.difficulty === "apprentice"
                    ? "bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green"
                    : tip.difficulty === "journeyman"
                    ? "bg-amber/10 text-amber"
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {tip.difficulty.charAt(0).toUpperCase() + tip.difficulty.slice(1)}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground">{tip.title}</h3>

              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {tip.content}
              </p>

              {tip.formulas && tip.formulas.length > 0 && (
                <div className="space-y-2">
                  {tip.formulas.map((formula, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-lg bg-amber/10 dark:bg-sparky-green/10 border border-amber/20 dark:border-sparky-green/20"
                    >
                      <code className="text-sm font-mono font-semibold text-amber dark:text-sparky-green">
                        {formula}
                      </code>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-3 py-2.5 rounded-lg bg-purple/10 dark:bg-purple/10 border border-purple/20 dark:border-purple/20">
                <p className="text-sm font-medium text-purple dark:text-purple-light">
                  <span className="font-bold">Sparky&apos;s Bottom Line:</span>{" "}
                  {tip.sparkyBottomLine}
                </p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
