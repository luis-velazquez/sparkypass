// TEMPLATE — implemented in the React Native app; NOT imported by web.
//
// Copy into the RN repo and replace the stubs:
//   - `mem` Map        -> MMKV (sync, non-sensitive cache)
//   - env()            -> expo-application (version) + expo-device (os/model)
//   - onLifecycle()    -> AppState 'background'
//   - ENDPOINT         -> `${API_BASE}/api/analytics`
//
// Kept here so the shared contract (platform.ts + client.ts) has a reference
// implementation co-located with the core. Compiles in this repo with no RN deps.
// See docs/analytics-instrumentation-plan.md §5 / §8.

import { createAnalytics, type Analytics } from "./client";
import type { AnalyticsBatch, AnalyticsEnv, AnalyticsPlatform } from "./platform";

const ENDPOINT = "/api/analytics"; // TODO(mobile): prefix with the API base URL

// TODO(mobile): replace with MMKV.getString / MMKV.set.
const mem = new Map<string, string>();

const nativePlatform: AnalyticsPlatform = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    mem.set(k, v);
  },
  async send(batch: AnalyticsBatch) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
  env(): AnalyticsEnv {
    // TODO(mobile): nativeApplicationVersion + Device.osVersion + Device.modelName.
    return { platform: "ios", appVersion: null, osVersion: null, deviceModel: null };
  },
  onLifecycle(_onBackground) {
    // TODO(mobile): AppState.addEventListener('change', s => s === 'background' && _onBackground()).
    return () => {};
  },
  now: () => Date.now(),
};

export function createNativeAnalytics(): Analytics {
  return createAnalytics(nativePlatform);
}
