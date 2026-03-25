"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

type ClientEvent =
  | "page_view"
  | "feature_use"
  | "quiz_start"
  | "quiz_complete"
  | "feedback_prompt_shown"
  | "feedback_submitted"
  | "drop_off";

function sendEvent(event: ClientEvent, page?: string, metadata?: Record<string, unknown>) {
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon(
      "/api/analytics",
      JSON.stringify({ event, page, metadata })
    );
  } else {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, page, metadata }),
      keepalive: true,
    }).catch(() => {});
  }
}

/**
 * Auto-tracks page views on route change.
 * Returns a `track` function for manual event tracking.
 */
export function useAnalytics() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  // Track page views on route change
  useEffect(() => {
    if (pathname && pathname !== prevPathname.current) {
      sendEvent("page_view", pathname);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  const track = useCallback(
    (event: ClientEvent, metadata?: Record<string, unknown>) => {
      sendEvent(event, pathname, metadata);
    },
    [pathname]
  );

  return { track };
}
