"use client";

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
  Activity,
  Trophy,
  Target,
  ClipboardCheck,
  AlertTriangle,
  Lightbulb,
  Crosshair,
  Languages,
  Gamepad2,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
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
      { href: "/index-game", label: "Index Game", icon: Target },
      { href: "/index-sniper", label: "Index Sniper", icon: Crosshair },
      { href: "/translation-engine", label: "Translation Engine", icon: Languages },
      // { href: "/formula-builder", label: "Formula Builder", icon: Gamepad2 }, // Beta — hidden until ready
    ],
  },
  {
    label: "Study",
    links: [
      { href: "/flashcards", label: "Flashcards", icon: Layers },
      { href: "/daily", label: "Daily Challenge", icon: Calendar },
      { href: "/review", label: "Weak Spots", icon: AlertTriangle },
      { href: "/load-calculator", label: "Load Calculator", icon: Calculator },
      { href: "/tips", label: "Sparky Tips", icon: Lightbulb },
    ],
  },
  {
    label: "Progress",
    links: [
      { href: "/power-grid", label: "Power Grid", icon: Activity },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Shop",
    links: [
      { href: "/power-ups", label: "Power-Ups", icon: Zap },
      { href: "/watts", label: "Watts Bank", icon: Activity },
    ],
  },
  {
    label: "Challenge Mode",
    links: [
      { href: "/quiz", label: "Quiz", icon: BookOpen },
      { href: "/circuit-breaker", label: "Circuit Breaker", icon: ShieldAlert },
    ],
  },
  { href: "/mock-exam", label: "Mock Exam", icon: ClipboardCheck },
];

// ─── Sidebar Group Section ───────────────────────────────────────────────────

function SidebarSection({ group, collapsed }: { group: SidebarGroup; collapsed: boolean }) {
  const pathname = usePathname();
  const siblingHrefs = group.links.map((l) => l.href);

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
              title={link.label}
              className={`flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors ${
                isActive
                  ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)]"
                  : isTip
                    ? "text-amber dark:text-sparky-green hover:bg-amber/10 dark:hover:bg-sparky-green-bg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              {link.label}
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
            <span className="text-xl font-bold text-foreground whitespace-nowrap">SparkyPass</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto hide-scrollbar py-2 space-y-3 relative z-10 ${collapsed ? "px-1.5" : "px-3"}`}>
        {navItems.map((item) => {
          if (isSidebarGroup(item)) {
            return <SidebarSection key={item.label} group={item} collapsed={collapsed} />;
          }

          const Icon = item.icon;
          const isActive = isNavLinkActive(pathname, item.href);

          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors ${
                  isActive
                    ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
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
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${
                isActive
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
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            &copy; {new Date().getFullYear()} SparkyPass
          </p>
        </div>
      )}
    </aside>
  );
}
