// Platform-agnostic analytics core. Compiles unchanged in React Native — only
// the AnalyticsPlatform adapter (platform.ts) differs. The first-party ingestion
// route derives userId server-side, so this client only manages anon_id /
// session_id / offline queue. See docs/analytics-instrumentation-plan.md §5.

import { isValidEvent, type EventName } from "@/lib/analytics-events";
import type { AnalyticsPlatform, QueuedEvent } from "./platform";

const ANON_KEY = "sp_analytics_anon";
const QUEUE_KEY = "sp_analytics_queue";
const MAX_BATCH = 50;
const MAX_QUEUE = 1000; // offline cap — drop oldest beyond this
const FLUSH_INTERVAL_MS = 15_000;
const SESSION_IDLE_MS = 30 * 60 * 1000; // rotate session after 30 min idle

function genId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback — idempotency key only; cryptographic strength not required.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface Analytics {
  /** Start the flush timer + lifecycle subscription. Idempotent. */
  init(): void;
  /** Enqueue an event (batched + flushed). Unknown events are dropped. */
  track(event: EventName, properties?: Record<string, unknown>, page?: string): void;
  /** Set the authenticated user (drives PostHog identity in Phase 4). */
  identify(userId: string | null): void;
  /** Force-send the queue now. */
  flush(): Promise<void>;
  shutdown(): void;
}

export function createAnalytics(platform: AnalyticsPlatform): Analytics {
  let queue: QueuedEvent[] = [];
  let anonId = "";
  let sessionId = "";
  let currentUserId: string | null = null;
  let lastActivity = 0;
  let started = false;
  let flushing = false;
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  function ensureAnon(): void {
    if (anonId) return;
    const existing = platform.getItem(ANON_KEY);
    if (existing) {
      anonId = existing;
      return;
    }
    anonId = genId();
    platform.setItem(ANON_KEY, anonId);
  }

  function touchSession(): void {
    const t = platform.now();
    if (!sessionId || t - lastActivity > SESSION_IDLE_MS) sessionId = genId();
    lastActivity = t;
  }

  function persist(): void {
    try {
      platform.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {
      /* quota / private mode — drop persistence, keep in memory */
    }
  }

  function hydrate(): void {
    try {
      const raw = platform.getItem(QUEUE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // Merge (don't replace) so events tracked before init() survive.
      if (Array.isArray(parsed)) queue = [...parsed, ...queue].slice(-MAX_QUEUE);
    } catch {
      /* corrupt cache — ignore */
    }
  }

  async function flush(): Promise<void> {
    if (flushing || queue.length === 0) return;
    flushing = true;
    const batch = queue.slice(0, MAX_BATCH);
    try {
      ensureAnon();
      const ok = await platform.send({
        anonId,
        sessionId,
        userId: currentUserId,
        env: platform.env(),
        events: batch,
      });
      if (ok) queue = queue.slice(batch.length); // drop only on confirmed success
      persist(); // server dedupes by eventId, so a kept batch is safe to resend
    } catch {
      persist();
    } finally {
      flushing = false;
    }
  }

  return {
    init() {
      if (started) return;
      started = true;
      ensureAnon();
      hydrate();
      touchSession();
      flushTimer = setInterval(() => {
        void flush();
      }, FLUSH_INTERVAL_MS);
      unsubscribe = platform.onLifecycle(() => {
        persist();
        void flush();
      });
    },
    track(event, properties, page) {
      if (!isValidEvent(event)) return;
      ensureAnon();
      touchSession();
      queue.push({ eventId: genId(), event, properties, page, clientTs: platform.now() });
      if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
      if (queue.length >= MAX_BATCH) void flush();
    },
    identify(userId) {
      currentUserId = userId;
    },
    flush,
    shutdown() {
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      persist();
      started = false;
    },
  };
}
