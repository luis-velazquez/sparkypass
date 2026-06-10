// Platform adapter contract for the analytics client. The shared core
// (client.ts) is identical on web and React Native; only this ~6-method adapter
// differs per platform. See docs/analytics-instrumentation-plan.md §5.

import type { Platform } from "@/lib/analytics-events";

export interface AnalyticsEnv {
  platform: Platform;
  appVersion: string | null;
  osVersion: string | null;
  deviceModel: string | null;
}

export interface QueuedEvent {
  eventId: string;
  event: string;
  properties?: Record<string, unknown>;
  page?: string;
  clientTs: number;
}

export interface AnalyticsBatch {
  anonId: string;
  sessionId: string;
  /**
   * Forward hint for PostHog identity (Phase 4). The first-party ingestion route
   * derives userId from the auth session and does NOT trust this field.
   */
  userId?: string | null;
  env: AnalyticsEnv;
  events: QueuedEvent[];
}

export interface AnalyticsPlatform {
  /** Persistent KV. web: localStorage; RN: MMKV (sync, non-sensitive cache). */
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  /** Deliver a batch to /api/analytics. true = success (drop events); false = keep & retry. */
  send(batch: AnalyticsBatch): Promise<boolean>;
  /** Static environment descriptors (platform / versions / device). */
  env(): AnalyticsEnv;
  /** Subscribe to app-background / page-hide. Returns an unsubscribe fn. */
  onLifecycle(onBackground: () => void): () => void;
  /** Wall clock (unix ms). */
  now(): number;
}
