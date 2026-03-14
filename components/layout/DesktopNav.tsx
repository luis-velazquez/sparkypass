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
import { NavTipButton } from "@/components/tip";

interface NavLink {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

type NavItem = NavLink | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
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

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  {
    label: "Study",
    links: [
      { href: "/flashcards", label: "Flashcards" },
      { href: "/daily", label: "Daily Challenge" },
      { href: "/review", label: "Weak Spots" },
      { href: "/load-calculator", label: "Load Calculator" },
    ],
  },
  {
    label: "Progress",
    links: [
      { href: "/power-grid", label: "Power Grid" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    label: "Shop",
    links: [
      { href: "/power-ups", label: "Power-Ups" },
      { href: "/watts", label: "Watts Bank" },
    ],
  },
  {
    label: "Challenge Mode",
    links: [
      { href: "/quiz", label: "Quiz" },
      { href: "/circuit-breaker", label: "Circuit Breaker" },
      { href: "/index-game", label: "Index Game" },
    ],
  },
  { href: "/mock-exam", label: "Mock Exam" },
];

function NavDropdown({ group, suffix }: { group: NavGroup; suffix?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const siblingHrefs = group.links.map((l) => l.href);
  const isActive = group.links.some(
    (link) => isNavLinkActive(pathname, link.href, siblingHrefs)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isActive
              ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {group.label}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start" sideOffset={8}>
        {group.links.map((link) => {
          const linkActive = isNavLinkActive(pathname, link.href, siblingHrefs);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                linkActive
                  ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)] font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {suffix}
      </PopoverContent>
    </Popover>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  const { status } = useSession();

  if (status !== "authenticated") return null;

  return (
    <nav data-tour="nav-desktop" className="hidden xl:flex items-center gap-1">
      {navItems.map((item) => {
        if (isGroup(item)) {
          return (
            <NavDropdown
              key={item.label}
              group={item}
              suffix={item.label === "Study" ? <NavTipButton variant="desktop" /> : undefined}
            />
          );
        }

        const isActive = isNavLinkActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green dark:drop-shadow-[0_0_6px_rgba(163,255,0,0.2)]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
