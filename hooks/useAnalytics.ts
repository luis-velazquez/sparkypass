"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getAnalytics } from "@/lib/analytics/web";
import type { EventName } from "@/lib/analytics-events";

/**
 * Auto-tracks `page_view` on route change and returns a typed `track()` for
 * manual events. Delegates to the batching singleton (lib/analytics/web).
 */
export function useAnalytics() {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);
  const opened = useRef(false);

  // Fire app_open once per page load (the provider mounts this once at root).
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    getAnalytics().track("app_open");
  }, []);

  useEffect(() => {
    if (pathname && pathname !== prev.current) {
      getAnalytics().track("page_view", undefined, pathname);
      prev.current = pathname;
    }
  }, [pathname]);

  const track = useCallback(
    (event: EventName, properties?: Record<string, unknown>) => {
      getAnalytics().track(event, properties, pathname ?? undefined);
    },
    [pathname],
  );

  return { track };
}
