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
  Calculator,
  Building2,
  Zap,
  ShieldAlert,
  Activity,
  Users,
  Trophy,
  ChevronDown,
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

const navItems: MobileNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Study",
    icon: BookOpen,
    links: [
      { href: "/quiz", label: "Quiz", icon: BookOpen },
      { href: "/flashcards", label: "Flashcards", icon: Layers },
      { href: "/mock-exam", label: "Mock Exam", icon: ClipboardCheck },
      { href: "/daily", label: "Daily Challenge", icon: Calendar },
    ],
  },
  {
    label: "Progress",
    icon: Activity,
    links: [
      { href: "/power-grid", label: "Power Grid", icon: Activity },
      { href: "/circuit-breaker", label: "Circuit Breaker", icon: ShieldAlert },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Tools",
    icon: Calculator,
    links: [
      { href: "/load-calculator", label: "Residential Calc", icon: Calculator },
      { href: "/load-calculator/commercial", label: "Commercial Calc", icon: Building2 },
      { href: "/power-ups", label: "Power-Ups", icon: Zap },
    ],
  },
  { href: "/friends", label: "Friends", icon: Users },
];

function MobileNavSection({
  group,
  pathname,
  onNavigate,
}: {
  group: MobileNavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = group.links.some(
    (link) => pathname === link.href || pathname.startsWith(link.href + "/")
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
            const linkActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
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
          <Zap className="h-7 w-7 text-amber dark:hidden" />
          <div className="w-8 h-8 rounded-lg bg-stone-900 hidden dark:flex items-center justify-center">
            <img src="/lightning-bolt.svg" alt="SparkyPass" className="w-5 h-5" />
          </div>
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
                  />
                );
              }

              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");

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
            <NavTipButton variant="mobile" onAfterOpen={closeSheet} />
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
