"use client";

import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebar } from "./SidebarContext";

// Both classes must appear as full strings for Tailwind v4 detection:
// xl:pl-[240px] xl:pl-[68px]

// ─── Page title mapping ──────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/flashcards": "Flashcards",
  "/daily": "Daily Challenge",
  "/review": "Weak Spots",
  "/load-calculator": "Load Calculator",
  "/load-calculator/commercial": "Commercial Load Calculator",
  "/tips": "Sparky Tips",
  "/power-grid": "Power Grid",
  "/leaderboard": "Leaderboard",
  "/power-ups": "Power-Ups",
  "/watts": "Watts Bank",
  "/quiz": "Quiz",
  "/circuit-breaker": "Circuit Breaker",
  "/index-game": "Index Game",
  "/index-sniper": "Index Trace",
  "/translation-engine": "Slang to Code",
  "/formula-builder": "Formula Builder",
  "/apprentice/quiz": "Apprentice Quiz",
  "/mock-exam": "Mock Exam",
  "/bookmarks": "Bookmarks",
  "/bookmarks/review": "Bookmark Review",
  "/friends": "Friends",
  "/settings": "Settings",
  "/contact": "Contact",
  "/privacy": "Privacy",
  "/terms": "Terms",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  // Try progressively shorter prefixes (e.g. /quiz/grounding → "Quiz")
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 1; i--) {
    const prefix = "/" + segments.slice(0, i).join("/");
    if (PAGE_TITLES[prefix]) return PAGE_TITLES[prefix];
  }

  return "SparkyPass";
}

// ─── Components ──────────────────────────────────────────────────────────────

const MARKETING_PATHS = ["/", "/login", "/register", "/pricing"];

export function SidebarContentWrapper({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const isMarketing = MARKETING_PATHS.includes(pathname);

  return (
    <div className={`transition-[padding-left] duration-200 ${isMarketing ? "" : collapsed ? "xl:pl-[68px]" : "xl:pl-[240px]"}`}>
      {children}
    </div>
  );
}

export function SidebarTopBar({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <div className={`hidden xl:block sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-[padding-left] duration-200 ${collapsed ? "xl:pl-[68px]" : "xl:pl-[240px]"}`}>
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" />
            )}
          </button>
          <span className="text-sm font-medium text-foreground">{pageTitle}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
