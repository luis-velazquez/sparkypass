"use client";

import { usePathname } from "next/navigation";

/**
 * Hides children on marketing pages (landing, login, register, pricing)
 * where the app nav chrome is not needed.
 */
const MARKETING_PATHS = ["/", "/login", "/register", "/pricing"];

export function HideOnMarketing({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (MARKETING_PATHS.includes(pathname)) return null;

  return <>{children}</>;
}
