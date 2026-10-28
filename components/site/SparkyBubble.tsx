import type { ReactNode } from "react";

/**
 * Sparky with a speech bubble. Server-safe (no framer-motion), uses the
 * current mascot family that ships in the app (white hard hat, orange vest).
 */
export type SparkyPose = "vest" | "thinking" | "sad" | "graduation";

const POSES: Record<SparkyPose, string> = {
  vest: "/sparkypass-vest.svg",
  thinking: "/sparkypass-thinking.svg",
  sad: "/sparkypass-sad.svg",
  graduation: "/sparkypass-graduation.svg",
};

export function SparkyBubble({
  children,
  pose = "vest",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  pose?: SparkyPose;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const avatar = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-20 w-20 md:h-24 md:w-24" }[size];
  const bubble = {
    sm: "px-3 py-2 text-sm rounded-xl",
    md: "px-4 py-3 text-[15px] rounded-2xl",
    lg: "px-5 py-4 text-base md:text-lg rounded-2xl",
  }[size];
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG */}
      <img src={POSES[pose]} alt="" aria-hidden="true" className={`${avatar} shrink-0`} />
      <div
        className={`min-w-0 text-foreground border border-purple/20 bg-[rgba(139,92,246,0.08)] shadow-[0_0_16px_rgba(139,92,246,0.08)] ${bubble}`}
      >
        {children}
      </div>
    </div>
  );
}
