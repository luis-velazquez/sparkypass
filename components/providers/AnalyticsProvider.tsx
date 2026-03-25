"use client";

import { useSession } from "next-auth/react";
import { useAnalytics } from "@/hooks/useAnalytics";

/**
 * Mounts the analytics hook for authenticated users.
 * Drop this inside SessionProvider to auto-track page views.
 */
export function AnalyticsProvider() {
  const { status } = useSession();
  // The hook auto-tracks page views internally
  useAnalytics();

  // Only run when authenticated — no-op component
  if (status !== "authenticated") return null;
  return null;
}
