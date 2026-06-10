"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getAnalytics } from "@/lib/analytics/web";

/**
 * Boots the analytics singleton (queue + batching + lifecycle flush) and keeps
 * identity in sync with the NextAuth session. Page views auto-track via
 * useAnalytics(). Must render inside SessionProvider.
 */
export function AnalyticsProvider() {
  const { data: session, status } = useSession();

  // Auto-track page views (anon + authenticated).
  useAnalytics();

  // Boot the singleton once.
  useEffect(() => {
    getAnalytics().init();
  }, []);

  // Keep identity in sync as auth resolves. First-party ingestion derives userId
  // server-side; this drives PostHog identity in Phase 4 (carried as a batch hint).
  useEffect(() => {
    if (status === "loading") return;
    getAnalytics().identify(session?.user?.id ?? null);
  }, [status, session?.user?.id]);

  return null;
}
