"use client";

import { useState } from "react";
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
  Swords,
  Activity,
  Users,
  Trophy,
  ChevronDown,
  AlertTriangle,
  Crosshair,
  Languages,
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
      { href: "/translation-engine", label: "Translation Engine", icon: Languages },
      // { href: "/formula-builder", label: "Formula Builder", icon: Gamepad2 }, // Beta — hidden until ready
    ],
  },
  {
    label: "Study",
    icon: BookOpen,
    links: [
      { href: "/flashcards", label: "Flashcards", icon: Layers },
      { href: "/daily", label: "Daily Challenge", icon: Calendar },
      { href: "/review", label: "Weak Spots", icon: AlertTriangle },
      { href: "/load-calculator", label: "Load Calculator", icon: Calculator },
    ],
  },
  {
    label: "Progress",
    icon: Activity,
    links: [
      { href: "/power-grid", label: "Power Grid", icon: Activity },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Shop",
    icon: Zap,
    links: [
      { href: "/power-ups", label: "Power-Ups", icon: Zap },
      { href: "/watts", label: "Watts Bank", icon: Activity },
    ],
  },
  {
    label: "Challenge Mode",
    icon: Swords,
    links: [
      { href: "/quiz", label: "Quiz", icon: BookOpen },
      { href: "/circuit-breaker", label: "Circuit Breaker", icon: ShieldAlert },
    ],
  },
  { href: "/mock-exam", label: "Mock Exam", icon: ClipboardCheck },
];

function MobileNavSection({
  group,
  pathname,
  onNavigate,
  suffix,
}: {
  group: MobileNavGroup;
  pathname: string;
  onNavigate: () => void;
  suffix?: React.ReactNode;
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
                {link.label}
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
                  />
                );
              }

              const Icon = item.icon;
              const isActive = isNavLinkActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSheet}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] text-lg ${
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
