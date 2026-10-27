/**
 * Shape of the 60 public practice questions. This is a frozen, whitelisted
 * snapshot generated from data/questions by scripts/build-practice-tests.mjs —
 * the app's question bank (data/questions/*.json) is never served to browsers.
 */
export type TestSlug = "test-1" | "test-2" | "test-3";

export interface PracticeQuestion {
  /** Question-bank id, e.g. "BF-J001". */
  id: string;
  /** 1-based position within the test. */
  n: number;
  /** Display topic, e.g. "Box Fill". */
  topic: string;
  calculation: boolean;
  prompt: string;
  /** Four choices, order shuffled deterministically at build time. */
  options: string[];
  /** Index into `options`. */
  answer: number;
  explanation: string;
  /** Section reference as printed in the 2023 NEC, without the "NEC " prefix. */
  ref2023: string;
  /** Same section in the 2026 NEC (identical unless renumbered). */
  ref2026: string;
  /** Sparky's one-line tip. */
  tip: string;
}

export interface PracticeTest {
  slug: TestSlug;
  number: 1 | 2 | 3;
  title: string;
  blurb: string;
  /** Short topic chips shown on the test card. */
  focus: string[];
  questions: PracticeQuestion[];
}
