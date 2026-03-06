"use client";

import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SheetClose } from "@/components/ui/sheet";

interface NavTipButtonProps {
  variant: "desktop" | "mobile";
}

export function NavTipButton({ variant }: NavTipButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === "/tips";

  if (variant === "desktop") {
    return (
      <Link
        href="/tips"
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
          isActive
            ? "bg-amber/10 dark:bg-sparky-green-bg text-amber dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium"
            : "text-amber dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] hover:bg-amber/10 dark:hover:bg-sparky-green-bg"
        }`}
      >
        <Lightbulb className="h-3.5 w-3.5" />
        Sparky Tips
      </Link>
    );
  }

  return (
    <SheetClose asChild>
      <Link
        href="/tips"
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] w-full text-lg ${
          isActive
            ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium border-l-3 border-amber dark:border-sparky-green"
            : "text-amber dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] hover:bg-amber/10 dark:hover:bg-sparky-green-bg"
        }`}
      >
        <Lightbulb className="h-6 w-6 flex-shrink-0" />
        Sparky Tips
      </Link>
    </SheetClose>
  );
}
