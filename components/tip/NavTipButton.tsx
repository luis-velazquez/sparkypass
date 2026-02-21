"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getTodaysTip, getTodayDateString, TIP_ENABLED_KEY, TIP_LAST_SHOWN_KEY } from "@/lib/tips";

interface NavTipButtonProps {
  variant: "desktop" | "mobile";
  autoOpen?: boolean;
  onAfterOpen?: () => void;
}

export function NavTipButton({ variant, autoOpen = false, onAfterOpen }: NavTipButtonProps) {
  const [open, setOpen] = useState(false);
  const tip = getTodaysTip();

  useEffect(() => {
    if (!autoOpen) return;

    const enabled = localStorage.getItem(TIP_ENABLED_KEY);
    if (enabled === "false") return;

    const lastShown = localStorage.getItem(TIP_LAST_SHOWN_KEY);
    const today = getTodayDateString();
    if (lastShown === today) return;

    localStorage.setItem(TIP_LAST_SHOWN_KEY, today);
    setOpen(true);
  }, [autoOpen]);

  const handleClick = () => {
    onAfterOpen?.();
    setOpen(true);
  };

  const trigger =
    variant === "desktop" ? (
      <button
        onClick={handleClick}
        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-amber dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] hover:bg-amber/10 dark:hover:bg-sparky-green-bg flex items-center gap-1.5"
      >
        <Lightbulb className="h-3.5 w-3.5" />
        Tip
      </button>
    ) : (
      <button
        onClick={handleClick}
        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] w-full text-lg text-amber dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] hover:bg-amber/10 dark:hover:bg-sparky-green-bg"
      >
        <Lightbulb className="h-6 w-6 flex-shrink-0" />
        Tip of the Day
      </button>
    );

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-stone-900 dark:border-stone-800">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-amber/20 dark:bg-sparky-green/20 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-amber dark:text-sparky-green" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Tip of the Day
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-amber/10 dark:bg-sparky-green/10 text-amber dark:text-sparky-green font-medium">
                  {tip.category}
                </span>
                <span>{tip.necReference}</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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

            <Button
              onClick={() => setOpen(false)}
              className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 focus-visible:ring-amber/50 dark:focus-visible:ring-sparky-green/50 focus-visible:border-transparent"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
