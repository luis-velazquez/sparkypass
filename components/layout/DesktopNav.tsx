"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quiz", label: "Quiz" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/mock-exam", label: "Mock Exam" },
  { href: "/daily", label: "Daily Challenge" },
  { href: "/load-calculator", label: "Load Calculator" },
  { href: "/settings", label: "Settings" },
];

const calcSubLinks = [
  { href: "/load-calculator", label: "Residential" },
  { href: "/load-calculator/commercial", label: "Commercial" },
];

export function DesktopNav() {
  const pathname = usePathname();
  const [calcOpen, setCalcOpen] = useState(false);
  const { status } = useSession();

  if (status !== "authenticated") return null;

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

        if (link.href === "/load-calculator") {
          return (
            <Popover key={link.href} open={calcOpen} onOpenChange={setCalcOpen}>
              <div
                className={`group flex items-center rounded-md transition-colors ${
                  isActive
                    ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Link
                  href={link.href}
                  className="pl-3 pr-1.5 py-1.5 text-sm font-medium"
                >
                  {link.label}
                </Link>
                <PopoverTrigger asChild>
                  <button
                    className={`pl-1.5 pr-2 py-1.5 border-l ${
                      isActive ? "border-amber/25 dark:border-sparky-green/25" : "border-transparent group-hover:border-muted-foreground/20"
                    }`}
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${calcOpen ? "rotate-180" : ""}`} />
                  </button>
                </PopoverTrigger>
              </div>
              <PopoverContent className="w-44 p-1" align="start" sideOffset={8}>
                {calcSubLinks.map((sub) => {
                  const subActive = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setCalcOpen(false)}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        subActive
                          ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
