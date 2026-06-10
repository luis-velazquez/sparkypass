// Web adapter for the analytics core. Browser globals are only touched inside
// the methods (never at module load), so this is safe to import during SSR.
// See docs/analytics-instrumentation-plan.md §5.

import { createAnalytics, type Analytics } from "./client";
import type { AnalyticsBatch, AnalyticsEnv, AnalyticsPlatform } from "./platform";

const ENDPOINT = "/api/analytics";

function browserEnv(): AnalyticsEnv {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  return {
    platform: "web",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
    osVersion: nav?.platform ?? null, // coarse ("MacIntel"/"Win32"); enough to slice web
    deviceModel: null,
  };
}

const webPlatform: AnalyticsPlatform = {
  getItem(key) {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    } catch {
      /* private mode / quota — non-fatal */
    }
  },
  async send(batch: AnalyticsBatch) {
    const payload = JSON.stringify(batch);
    // On page-hide a fetch may be killed mid-flight; sendBeacon is best-effort
    // but survives unload. Use it only when the page is actually hidden.
    if (
      typeof navigator !== "undefined" &&
      "sendBeacon" in navigator &&
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      try {
        return navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
      } catch {
        /* fall through to fetch */
      }
    }
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
      return res.ok;
    } catch {
      return false;
    }
  },
  env: browserEnv,
  onLifecycle(onBackground) {
    if (typeof document === "undefined" || typeof window === "undefined") return () => {};
    const onVis = () => {
      if (document.visibilityState === "hidden") onBackground();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onBackground);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onBackground);
    };
  },
  now() {
    return Date.now();
  },
};

let instance: Analytics | null = null;

/** The per-tab analytics singleton. */
export function getAnalytics(): Analytics {
  if (!instance) instance = createAnalytics(webPlatform);
  return instance;
}
