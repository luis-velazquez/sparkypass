"use client";

import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";

const STORAGE_KEY = "sparkypass-beta-banner-dismissed";

export function BetaBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (!mounted || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <div className="relative z-[60] bg-amber dark:bg-sparky-green text-white dark:text-stone-950 text-center text-sm py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <Zap className="h-3.5 w-3.5 flex-shrink-0" />
        <p className="font-medium">
          You&apos;re viewing SparkyPass Beta &mdash; features may change and
          your feedback shapes the product.{" "}
          <a href="/contact" className="underline underline-offset-2 hover:no-underline font-semibold">
            Give feedback
          </a>
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/20 dark:hover:bg-black/10 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
