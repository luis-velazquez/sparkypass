"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Calendar,
  Calculator,
  Zap,
  ShieldAlert,
  Grid3X3,
  Trophy,
  Target,
  ClipboardCheck,
  AlertTriangle,
  Lightbulb,
  Crosshair,
  Languages,
  Wallet,
  TrendingUp,
  Gamepad2,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { BetaBadge } from "@/components/ui/beta-badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "daily" | "breaker";
}

interface SidebarGroup {
  label: string;
  links: SidebarLink[];
}

type SidebarItem = SidebarLink | SidebarGroup;

function isSidebarGroup(item: SidebarItem): item is SidebarGroup {
  return "links" in item;
}

// ─── Active link detection ───────────────────────────────────────────────────

function isNavLinkActive(pathname: string, href: string, siblingHrefs: string[] = []): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(href + "/")) return false;
  return !siblingHrefs.some(
    (sibling) =>
      sibling !== href &&
      sibling.length > href.length &&
      (pathname === sibling || pathname.startsWith(sibling + "/"))
  );
}

// ─── Nav items ───────────────────────────────────────────────────────────────

const navItems: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Games",
    links: [
      // { href: "/index-game", label: "Index Game", icon: Target }, // Hidden — replaced by Index Trace
      { href: "/index-sniper", label: "Index Trace", icon: Crosshair },
      { href: "/translation-engine", label: "Slang to Code", icon: Languages },
      { href: "/circuit-breaker", label: "Circuit Breaker", icon: ShieldAlert, badge: "breaker" },
      // { href: "/formula-builder", label: "Formula Builder", icon: Gamepad2 }, // Beta — hidden until ready
    ],
  },
  {
    label: "Review",
    links: [
      { href: "/quiz", label: "Quiz", icon: BookOpen },
      { href: "/review", label: "Weak Spots", icon: AlertTriangle },
      { href: "/daily", label: "Daily Challenge", icon: Calendar, badge: "daily" },
    ],
  },
  {
    label: "Study",
    links: [
      { href: "/flashcards", label: "Flashcards", icon: Layers },
      { href: "/load-calculator", label: "Load Calculator", icon: Calculator },
      { href: "/tips", label: "Sparky Tips", icon: Lightbulb },
    ],
  },
  {
    label: "Progress",
    links: [
      { href: "/power-grid", label: "Power Grid", icon: Grid3X3 },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Shop",
    links: [
      { href: "/power-ups", label: "Power-Ups", icon: Zap },
      { href: "/watts", label: "Watts Bank", icon: Wallet },
    ],
  },
  { href: "/mock-exam", label: "Mock Exam", icon: ClipboardCheck },
];

// ─── Badge status hook ──────────────────────────────────────────────────────

function useBadgeStatus() {
  const { status } = useSession();
  const [dailyDone, setDailyDone] = useState<boolean | null>(null);
  const [trippedCount, setTrippedCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/progress/stats")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.dailyChallengeCompleted === "boolean") {
          setDailyDone(data.dailyChallengeCompleted);
        }
      })
      .catch(() => {});

    fetch("/api/circuit-breaker/status")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.trippedCount === "number") {
          setTrippedCount(data.trippedCount);
        }
      })
      .catch(() => {});
  }, [status]);

  return { dailyDone, trippedCount };
}

// ─── Badge components ───────────────────────────────────────────────────────

function DailyBadge({ done, collapsed }: { done: boolean | null; collapsed: boolean }) {
  if (done === null) return null;
  if (done) {
    return (
      <span className={`flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 dark:bg-sparky-green ${collapsed ? "absolute top-0.5 right-0.5" : ""}`} />
    );
  }
  return (
    <span className={`flex-shrink-0 w-2 h-2 rounded-full bg-amber dark:bg-sparky-green animate-pulse ${collapsed ? "absolute top-0.5 right-0.5" : ""}`} />
  );
}

function BreakerBadge({ count, collapsed }: { count: number; collapsed: boolean }) {
  if (count <= 0) return null;
  return (
    <span className={`flex-shrink-0 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white ${collapsed ? "absolute -top-0.5 -right-0.5 w-3.5 h-3.5" : "w-4 h-4"}`}>
      {count}
    </span>
  );
}

// ─── Collapsed Tooltip ──────────────────────────────────────────────────────

function SidebarTooltip({ label, group }: { label: string; group?: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 whitespace-nowrap">
      <span className="flex items-center gap-1.5 rounded-md bg-popover border border-border shadow-md px-2.5 py-1.5 text-xs text-foreground">
        {group && (
          <span className="text-muted-foreground font-medium">{group}</span>
        )}
        {group && <span className="text-muted-foreground/40">·</span>}
        <span className="font-medium">{label}</span>
      </span>
    </span>
  );
}

// ─── Sidebar Group Section ───────────────────────────────────────────────────

function SidebarSection({
  group,
  collapsed,
  dailyDone,
  trippedCount,
}: {
  group: SidebarGroup;
  collapsed: boolean;
  dailyDone: boolean | null;
  trippedCount: number;
}) {
  const pathname = usePathname();
  const siblingHrefs = group.links.map((l) => l.href);
  const isGroupActive = group.links.some((link) => isNavLinkActive(pathname, link.href, siblingHrefs));

  // Collapsed mode — just show the icons
  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {group.links.map((link) => {
          const Icon = link.icon;
          const isActive = isNavLinkActive(pathname, link.href, siblingHrefs);
          const isTip = link.href === "/tips";

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group/tip relative flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors ${
                isActive
                  ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)]"
                  : isTip
                    ? "text-amber dark:text-sparky-green hover:bg-amber/10 dark:hover:bg-sparky-green-bg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {link.badge === "daily" && <DailyBadge done={dailyDone} collapsed />}
              {link.badge === "breaker" && <BreakerBadge count={trippedCount} collapsed />}
              <SidebarTooltip label={link.label} group={group.label} />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
        isGroupActive ? "text-amber dark:text-sparky-green" : "text-muted-foreground"
      }`}>
        {group.label}
      </div>
      <div className="mt-0.5 space-y-0.5">
        {group.links.map((link) => {
          const Icon = link.icon;
          const isActive = isNavLinkActive(pathname, link.href, siblingHrefs);
          const isTip = link.href === "/tips";

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium"
                  : isTip
                    ? "text-amber dark:text-sparky-green hover:bg-amber/10 dark:hover:bg-sparky-green-bg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${
                isActive
                  ? "text-amber dark:text-sparky-green"
                  : isTip
                    ? "text-amber dark:text-sparky-green"
                    : "text-muted-foreground"
              }`} />
              <span className="flex-1">{link.label}</span>
              {link.badge === "daily" && <DailyBadge done={dailyDone} collapsed={false} />}
              {link.badge === "breaker" && <BreakerBadge count={trippedCount} collapsed={false} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar Component ───────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { status } = useSession();
  const { collapsed } = useSidebar();
  const { dailyDone, trippedCount } = useBadgeStatus();

  if (status !== "authenticated") return null;

  const width = collapsed ? "w-[68px]" : "w-[240px]";

  return (
    <aside
      data-tour="nav-desktop"
      className={`hidden xl:flex flex-col fixed top-0 left-0 bottom-0 ${width} border-r border-border bg-cream dark:bg-stone-950 z-40 transition-[width] duration-200 overflow-hidden`}
    >
      {/* Blueprint grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Logo */}
      <div className={`flex items-center h-16 flex-shrink-0 relative z-10 ${collapsed ? "justify-center px-0" : "gap-2 px-5"}`}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/sparkypass-icon-orange.svg" alt="SparkyPass" width={28} height={28} className="flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-xl font-bold text-foreground whitespace-nowrap">SparkyPass</span>
              <BetaBadge />
            </>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto hide-scrollbar py-2 space-y-3 relative z-10 ${collapsed ? "px-1.5" : "px-3"}`}>
        {navItems.map((item) => {
          if (isSidebarGroup(item)) {
            return (
              <SidebarSection
                key={item.label}
                group={item}
                collapsed={collapsed}
                dailyDone={dailyDone}
                trippedCount={trippedCount}
              />
            );
          }

          const Icon = item.icon;
          const isActive = isNavLinkActive(pathname, item.href);
          const isMockExam = item.href === "/mock-exam";

          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group/tip relative flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors ${
                  isActive
                    ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)]"
                    : isMockExam
                      ? "text-muted-foreground hover:text-foreground hover:bg-muted border border-border dark:border-stone-800"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <SidebarTooltip label={item.label} />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium"
                  : isMockExam
                    ? "text-foreground hover:bg-muted border border-dashed border-amber/30 dark:border-sparky-green/20 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${
                isActive
                  ? "text-amber dark:text-sparky-green"
                  : isMockExam
                    ? "text-amber dark:text-sparky-green"
                    : "text-muted-foreground"
              }`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="flex-shrink-0 border-t border-border relative z-10 px-5 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/changelog" className="hover:text-foreground transition-colors">
              Changelog
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            &copy; {new Date().getFullYear()} SparkyPass
          </p>
        </div>
      )}
    </aside>
  );
}
