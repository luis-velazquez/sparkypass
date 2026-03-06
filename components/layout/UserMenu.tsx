"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Zap, LogOut, Moon, Settings, Sun, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function UserMenu() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [wattsBalance, setWattsBalance] = useState<number | null>(null);
  const [necYear, setNecYear] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.wattsBalance !== undefined) setWattsBalance(data.wattsBalance);
        if (data?.necYear) setNecYear(data.necYear);
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    const wattsHandler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number") setWattsBalance(detail);
    };
    const necHandler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "2023" || detail === "2026") setNecYear(detail);
    };
    window.addEventListener("watts-updated", wattsHandler);
    window.addEventListener("nec-year-updated", necHandler);
    return () => {
      window.removeEventListener("watts-updated", wattsHandler);
      window.removeEventListener("nec-year-updated", necHandler);
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
    );
  }

  if (status !== "authenticated" || !session) return null;

  const initial = session.user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          className="w-11 h-11 rounded-full bg-amber/10 text-amber dark:bg-sparky-green-bg dark:text-sparky-green font-semibold text-sm flex items-center justify-center hover:bg-amber/20 dark:hover:bg-sparky-green-bg/80 transition-colors cursor-pointer"
          aria-label="User menu"
        >
          {initial}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm truncate">{session.user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
        </div>

        {/* Info row */}
        <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
          {necYear && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber/10 text-amber text-xs font-semibold">
              {necYear} NEC
            </span>
          )}
          {wattsBalance !== null && (
            <Link
              href="/watts"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber/10 text-amber dark:bg-sparky-green/10 dark:text-sparky-green text-xs font-semibold hover:bg-amber/20 dark:hover:bg-sparky-green/20 transition-colors cursor-pointer"
            >
              <Zap className="h-3 w-3 fill-current" />
              {wattsBalance.toLocaleString()}W
            </Link>
          )}
        </div>

        {/* Menu items */}
        <div className="py-1">
          <Link
            href="/watts"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            <Zap className="h-4 w-4 text-muted-foreground" />
            Watts Bank
          </Link>
          <Link
            href="/friends"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            Friends
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
          </Link>

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors w-full text-left cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-sparky-green drop-shadow-[0_0_6px_rgba(163,255,0,0.4)]" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          )}
        </div>

        {/* Logout */}
        <div className="border-t border-border py-1">
          <button
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors w-full text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
