"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { SparkyAvatar } from "./SparkyAvatar";

const sparkyMessageVariants = cva(
  "flex items-start gap-3",
  {
    variants: {
      size: {
        small: "gap-2",
        medium: "gap-3",
        large: "gap-4",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const speechBubbleVariants = cva(
  "relative text-foreground rounded-2xl break-words max-w-full backdrop-blur-sm bg-[rgba(139,92,246,0.10)] border border-purple/20 shadow-[0_0_16px_rgba(139,92,246,0.08)] dark:bg-[rgba(139,92,246,0.12)] dark:border-purple/20 dark:shadow-[0_0_16px_rgba(139,92,246,0.12)]",
  {
    variants: {
      size: {
        small: "px-3 py-2 text-sm rounded-xl",
        medium: "px-4 py-3 text-base rounded-2xl",
        large: "px-4 py-3 md:px-5 md:py-4 text-base md:text-lg rounded-2xl",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

export interface SparkyMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sparkyMessageVariants> {
  message: string;
}

export function SparkyMessage({
  message,
  size,
  className,
  ...props
}: SparkyMessageProps) {
  return (
    <div
      className={cn(sparkyMessageVariants({ size }), className)}
      {...props}
    >
      <div className="flex-shrink-0">
        <SparkyAvatar size={size} />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className={cn(speechBubbleVariants({ size }))}>
          {/* Speech bubble tail */}
          <div
            className="absolute left-0 top-3 -translate-x-2 w-0 h-0 dark:hidden"
            style={{
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderRight: "10px solid rgba(139, 92, 246, 0.10)",
            }}
          />
          <div
            className="absolute left-0 top-3 -translate-x-2 w-0 h-0 hidden dark:block"
            style={{
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderRight: "10px solid rgba(139, 92, 246, 0.12)",
            }}
          />
          <p className="relative z-10">{message}</p>
        </div>
      </div>
    </div>
  );
}
