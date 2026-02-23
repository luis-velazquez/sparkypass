"use client";

import type { TooltipRenderProps } from "react-joyride";
import { SparkyAvatar } from "@/components/sparky";
import { Button } from "@/components/ui/button";

export function SparkyTooltip({
  backProps,
  continuous,
  index,
  primaryProps,
  skipProps,
  step,
  size,
  tooltipProps,
}: TooltipRenderProps) {
  const isTourEnd = (step.data as { isTourEnd?: boolean })?.isTourEnd;

  return (
    <div
      {...tooltipProps}
      className="bg-card border border-border dark:border-stone-800 rounded-xl shadow-2xl p-5 max-w-xs z-[70]"
    >
      {/* Header with Sparky avatar + title */}
      <div className="flex items-center gap-3 mb-3">
        <SparkyAvatar size="small" />
        {step.title && (
          <h3 className="text-base font-bold font-display text-foreground">
            {step.title as string}
          </h3>
        )}
      </div>

      {/* Message */}
      <p className={`text-sm text-muted-foreground leading-relaxed ${isTourEnd ? "" : "mb-4"}`}>
        {step.content as string}
      </p>

      {!isTourEnd && (
        <>
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {Array.from({ length: size }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-5 bg-amber dark:bg-sparky-green"
                    : i < index
                    ? "w-1.5 bg-amber/40 dark:bg-sparky-green/40"
                    : "w-1.5 bg-muted dark:bg-stone-700"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              {...skipProps}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>

            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button
                  {...backProps}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 border-border dark:border-stone-700"
                >
                  Back
                </Button>
              )}
              {continuous && (
                <Button
                  {...primaryProps}
                  size="sm"
                  className="text-xs h-8 bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
