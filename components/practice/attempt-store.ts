"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-browser persistence for a practice-test attempt. A minimal external
 * store so the server render (no attempt) and the client render (restored
 * attempt) stay consistent through hydration via useSyncExternalStore.
 *
 * Each attempt carries a `fingerprint` of the question ids it was taken
 * against; an attempt saved for an earlier version of the test is discarded
 * rather than replayed against different questions.
 */
export interface Attempt {
  fingerprint: string;
  answers: Record<string, number>;
  startedAt: number | null;
  finishedAt: number | null;
}

const listeners = new Set<() => void>();
const cache = new Map<string, Attempt>();
const empties = new Map<string, Attempt>();

const key = (slug: string) => `sparkypass:practice:${slug}`;

/** Stable empty attempt per fingerprint (referential stability matters for useSyncExternalStore). */
export function emptyAttempt(fingerprint: string): Attempt {
  let e = empties.get(fingerprint);
  if (!e) {
    e = Object.freeze({ fingerprint, answers: {}, startedAt: null, finishedAt: null }) as Attempt;
    empties.set(fingerprint, e);
  }
  return e;
}

function read(slug: string, fingerprint: string): Attempt {
  const cached = cache.get(slug);
  if (cached) return cached;
  let value = emptyAttempt(fingerprint);
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Attempt>;
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.fingerprint === fingerprint &&
        parsed.answers &&
        typeof parsed.answers === "object"
      ) {
        value = {
          fingerprint,
          answers: parsed.answers,
          startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
          finishedAt: typeof parsed.finishedAt === "number" ? parsed.finishedAt : null,
        };
      }
    }
  } catch {
    /* storage unavailable: behave as a fresh attempt */
  }
  cache.set(slug, value);
  return value;
}

function write(slug: string, next: Attempt) {
  cache.set(slug, next);
  try {
    if (Object.keys(next.answers).length === 0) window.localStorage.removeItem(key(slug));
    else window.localStorage.setItem(key(slug), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAttempt(slug: string, fingerprint: string): [Attempt, (update: (prev: Attempt) => Attempt) => void] {
  const attempt = useSyncExternalStore(
    subscribe,
    () => read(slug, fingerprint),
    () => emptyAttempt(fingerprint),
  );
  const update = useCallback(
    (fn: (prev: Attempt) => Attempt) => {
      write(slug, fn(read(slug, fingerprint)));
    },
    [slug, fingerprint],
  );
  return [attempt, update];
}
