"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Menu,
  LayoutDashboard,
  BookOpen,
  Layers,
  ClipboardCheck,
  Calendar,
  Target,
  Calculator,
  Zap,
  ShieldAlert,
  Grid3X3,
  Trophy,
  ChevronDown,
  AlertTriangle,
  Crosshair,
  Languages,
  Wallet,
  TrendingUp,
  Gamepad2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavTipButton } from "@/components/tip";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface MobileNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "daily" | "breaker";
}

interface MobileNavGroup {
  label: string;
  icon: LucideIcon;
  links: MobileNavLink[];
}

type MobileNavItem = MobileNavLink | MobileNavGroup;

function isMobileGroup(item: MobileNavItem): item is MobileNavGroup {
  return "links" in item;
}

// Check if a nav link is active, preferring the most specific sibling match
function isNavLinkActive(pathname: string, href: string, siblingHrefs: string[] = []): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(href + "/")) return false;
  // Don't match if a more specific sibling also matches
  return !siblingHrefs.some(
    (sibling) =>
      sibling !== href &&
      sibling.length > href.length &&
      (pathname === sibling || pathname.startsWith(sibling + "/"))
  );
}

const navItems: MobileNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Games",
    icon: Gamepad2,
    links: [
      { href: "/index-game", label: "Index Game", icon: Target },
      { href: "/index-sniper", label: "Index Sniper", icon: Crosshair },
      { href: "/translation-engine", label: "Slang to Code", icon: Languages },
      // { href: "/formula-builder", label: "Formula Builder", icon: Gamepad2 }, // Beta — hidden until ready
    ],
  },
  {
    label: "Review",
    icon: BookOpen,
    links: [
      { href: "/quiz", label: "Quiz", icon: BookOpen },
      { href: "/review", label: "Weak Spots", icon: AlertTriangle },
      { href: "/daily", label: "Daily Challenge", icon: Calendar, badge: "daily" },
      { href: "/circuit-breaker", label: "Circuit Breaker", icon: ShieldAlert, badge: "breaker" },
    ],
  },
  {
    label: "Study",
    icon: Layers,
    links: [
      { href: "/flashcards", label: "Flashcards", icon: Layers },
      { href: "/load-calculator", label: "Load Calculator", icon: Calculator },
    ],
  },
  {
    label: "Progress",
    icon: TrendingUp,
    links: [
      { href: "/power-grid", label: "Power Grid", icon: Grid3X3 },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Shop",
    icon: Zap,
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

function MobileDailyBadge({ done }: { done: boolean | null }) {
  if (done === null) return null;
  return (
    <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
      done
        ? "bg-emerald-500 dark:bg-sparky-green"
        : "bg-amber dark:bg-sparky-green animate-pulse"
    }`} />
  );
}

function MobileBreakerBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full bg-red-500 text-white">
      {count}
    </span>
  );
}

function MobileNavSection({
  group,
  pathname,
  onNavigate,
  suffix,
  dailyDone,
  trippedCount,
}: {
  group: MobileNavGroup;
  pathname: string;
  onNavigate: () => void;
  suffix?: React.ReactNode;
  dailyDone: boolean | null;
  trippedCount: number;
}) {
  const siblingHrefs = group.links.map((l) => l.href);
  const isActive = group.links.some(
    (link) => isNavLinkActive(pathname, link.href, siblingHrefs)
  );
  const [expanded, setExpanded] = useState(isActive);
  const Icon = group.icon;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] w-full text-lg ${
          isActive
            ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium border-l-3 border-amber dark:border-sparky-green"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <Icon
          className={`h-6 w-6 flex-shrink-0 ${
            isActive
              ? "text-amber dark:text-sparky-green"
              : "text-muted-foreground"
          }`}
        />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="ml-4 mt-1 flex flex-col gap-1">
          {group.links.map((link) => {
            const SubIcon = link.icon;
            const linkActive = isNavLinkActive(pathname, link.href, siblingHrefs);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] text-base ${
                  linkActive
                    ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <SubIcon
                  className={`h-5 w-5 flex-shrink-0 ${
                    linkActive
                      ? "text-amber dark:text-sparky-green"
                      : "text-muted-foreground"
                  }`}
                />
                <span className="flex-1">{link.label}</span>
                {link.badge === "daily" && <MobileDailyBadge done={dailyDone} />}
                {link.badge === "breaker" && <MobileBreakerBadge count={trippedCount} />}
              </Link>
            );
          })}
          {suffix}
        </div>
      )}
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { dailyDone, trippedCount } = useBadgeStatus();

  const closeSheet = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          data-tour="nav-mobile"
          variant="ghost"
          size="icon"
          className="min-w-[44px] min-h-[44px]"
        >
          <Menu className="size-[22px]" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] px-3">
        <SheetTitle className="flex items-center gap-3 mb-8">
          <img src="/sparkypass-icon-orange.svg" alt="SparkyPass" className="w-7 h-7" />
          <span className="font-bold text-2xl">SparkyPass</span>
        </SheetTitle>

        {session && (
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              if (isMobileGroup(item)) {
                return (
                  <MobileNavSection
                    key={item.label}
                    group={item}
                    pathname={pathname}
                    onNavigate={closeSheet}
                    suffix={item.label === "Study" ? <NavTipButton variant="mobile" /> : undefined}
                    dailyDone={dailyDone}
                    trippedCount={trippedCount}
                  />
                );
              }

              const Icon = item.icon;
              const isActive = isNavLinkActive(pathname, item.href);
              const isMockExam = item.href === "/mock-exam";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSheet}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] text-lg ${
                    isActive
                      ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium border-l-3 border-amber dark:border-sparky-green"
                      : isMockExam
                        ? "text-foreground hover:bg-muted border border-dashed border-amber/30 dark:border-sparky-green/20 font-medium"
                        : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 flex-shrink-0 ${
                      isActive || isMockExam
                        ? "text-amber dark:text-sparky-green"
                        : "text-muted-foreground"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {!session && status !== "loading" && (
          <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-border">
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
            <Link href="/login" className="w-full" onClick={closeSheet}>
              <Button variant="outline" className="w-full min-h-[44px]">
                Log in
              </Button>
            </Link>
            <Link href="/register" className="w-full" onClick={closeSheet}>
              <Button className="w-full bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 min-h-[44px]">
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
