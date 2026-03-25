import { cn } from "@/lib/utils";

interface BetaBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function BetaBadge({ className, size = "sm" }: BetaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold uppercase tracking-wider rounded-full border",
        "bg-amber/10 text-amber border-amber/30",
        "dark:bg-sparky-green/10 dark:text-sparky-green dark:border-sparky-green/30",
        size === "sm" && "text-[9px] px-1.5 py-0.5 leading-none",
        size === "md" && "text-[10px] px-2 py-0.5 leading-none",
        className
      )}
    >
      Beta
    </span>
  );
}
