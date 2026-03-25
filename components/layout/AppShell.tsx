"use client";

import { usePathname } from "next/navigation";

/**
 * Hides children on marketing pages (landing, login, register, pricing)
 * where the app nav chrome is not needed.
 */
const MARKETING_PATHS = [
  "/",
  "/login",
  "/register",
  "/pricing",
  "/contact",
  "/privacy",
  "/terms",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/beta-agreement",
  "/changelog",
  "/known-issues",
  "/acceptable-use",
  "/dmca",
  "/status",
];

export function HideOnMarketing({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (MARKETING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return <>{children}</>;
}
