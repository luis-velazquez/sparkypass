"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppStoreBadge } from "@/components/site/AppStoreBadge";
import { SparkyBubble } from "@/components/site/SparkyBubble";
import { QuestionBlock, REVEALED } from "@/components/practice/QuestionBlock";
import { emptyAttempt, useAttempt } from "@/components/practice/attempt-store";
import type { PracticeTest as PracticeTestData, TestSlug } from "@/data/practice-tests/types";
import { EXAM_SECONDS_PER_QUESTION, QUESTION_COUNT_LABEL } from "@/lib/site";

const PASS_LINE = 0.7;

interface Sibling {
  slug: TestSlug;
  number: number;
  title: string;
  href: string;
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PracticeTest({ test, siblings }: { test: PracticeTestData; siblings: Sibling[] }) {
  const total = test.questions.length;
  const fingerprint = useMemo(() => test.questions.map((q) => q.id).join(","), [test.questions]);
  const [attempt, update] = useAttempt(test.slug, fingerprint);
  const { answers, startedAt, finishedAt } = attempt;
  const [now, setNow] = useState(0);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  // Clock ticks while the attempt is open.
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return;
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 1000);
    const first = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [startedAt, finishedAt]);

  const answeredCount = Object.keys(answers).length;
  const correct = useMemo(() => test.questions.filter((q) => answers[q.n] === q.answer).length, [answers, test.questions]);
  const done = answeredCount === total;

  // When the results appear, move focus to their heading so the change is announced.
  const wasDone = useRef(false);
  useEffect(() => {
    if (done && !wasDone.current) resultsHeadingRef.current?.focus({ preventScroll: true });
    wasDone.current = done;
  }, [done]);

  const choose = (n: number, index: number) => {
    update((prev) => {
      if (prev.answers[n] !== undefined) return prev;
      const nextAnswers = { ...prev.answers, [n]: index };
      const t = Date.now();
      return {
        fingerprint: prev.fingerprint,
        answers: nextAnswers,
        startedAt: prev.startedAt ?? t,
        finishedAt: Object.keys(nextAnswers).length === total ? t : prev.finishedAt,
      };
    });
  };

  const reset = () => {
    update(() => emptyAttempt(fingerprint));
    const first = document.getElementById("q-1-prompt") as HTMLElement | null;
    first?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    first?.focus({ preventScroll: true });
  };

  // `now` is 0 until the first tick (scheduled immediately), so the clamp keeps the clock at 0:00 for that instant.
  const elapsedSeconds = startedAt === null ? 0 : Math.max(0, Math.floor(((finishedAt ?? now) - startedAt) / 1000));
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const passed = correct / total >= PASS_LINE;
  const neededForPass = Math.ceil(total * PASS_LINE);
  const avgSeconds = done && startedAt ? Math.round(elapsedSeconds / total) : null;
  const missed = test.questions.filter((q) => answers[q.n] !== undefined && answers[q.n] !== q.answer);

  return (
    <div>
      {/* Sticky progress bar */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-cream/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-cream/80 sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[13px] text-stone-600">
          <span>
            <span className="font-bold text-foreground">{answeredCount}</span>/{total} answered
          </span>
          <span>
            <span className="font-bold text-emerald-800">{correct}</span> correct
          </span>
          <span className="tabular-nums">{startedAt === null ? "0:00" : formatClock(elapsedSeconds)}</span>
          {done ? (
            <a href="#results" className="ml-auto inline-flex min-h-9 items-center rounded-full bg-amber px-3.5 font-bold text-stone-900">
              See results
            </a>
          ) : (
            <span className="ml-auto hidden text-stone-600 sm:inline">Clock starts with your first answer</span>
          )}
        </div>
        <nav
          aria-label="Jump to question"
          className="hide-scrollbar mx-auto mt-2 flex max-w-3xl gap-2 overflow-x-auto pb-0.5 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] sm:[mask-image:none]"
        >
          {test.questions.map((q) => {
            const a = answers[q.n];
            const state = a === undefined ? "todo" : a === q.answer ? "right" : a === REVEALED ? "shown" : "wrong";
            const tone =
              state === "right"
                ? "border-emerald-700 bg-emerald-700 text-white"
                : state === "wrong"
                  ? "border-red-600 bg-red-600 text-white"
                  : state === "shown"
                    ? "border-stone-600 bg-stone-600 text-white"
                    : "border-border bg-white text-stone-600";
            const label =
              state === "todo" ? "" : state === "right" ? ", correct" : state === "wrong" ? ", incorrect" : ", answer shown";
            return (
              <a
                key={q.n}
                href={`#q-${q.n}`}
                aria-label={`Question ${q.n}${label}`}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[12px] font-bold ${tone}`}
              >
                {q.n}
              </a>
            );
          })}
        </nav>
      </div>

      <ol className="mt-6 space-y-5">
        {test.questions.map((q) => (
          <li key={q.id}>
            <QuestionBlock q={q} total={total} chosen={answers[q.n] ?? null} onChoose={(i) => choose(q.n, i)} />
          </li>
        ))}
      </ol>

      {done ? (
        <section
          id="results"
          aria-labelledby="results-heading"
          className="animate-reveal mt-10 scroll-mt-44 rounded-3xl border border-border bg-white p-6 shadow-elevated sm:scroll-mt-40 sm:p-8"
        >
          <h2
            id="results-heading"
            ref={resultsHeadingRef}
            tabIndex={-1}
            className="font-mono text-[12px] uppercase tracking-[0.16em] text-stone-600 outline-none"
          >
            Results · Practice test {test.number}
          </h2>
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
            <p className="font-display text-6xl font-extrabold leading-none tracking-tight text-foreground">
              {correct}
              <span className="text-2xl font-bold text-stone-600">/{total}</span>
            </p>
            <p className={`font-display text-3xl font-bold ${passed ? "text-emerald-800" : "text-red-700"}`}>{pct}%</p>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-stone-700 sm:text-base">
            {passed
              ? `You cleared the 70% line used in Texas and many other states (${neededForPass} of ${total} needed).`
              : `Below the 70% line used in Texas and many other states — you needed ${neededForPass} of ${total}. Review the missed questions below and try again.`}
            {avgSeconds !== null ? (
              <>
                {" "}
                Your pace: {formatClock(avgSeconds)} per question
                {avgSeconds <= EXAM_SECONDS_PER_QUESTION
                  ? ", inside the app's three-minute-per-question target."
                  : ", slower than the app's three-minute-per-question target."}
              </>
            ) : null}
          </p>

          {missed.length ? (
            <div className="mt-5">
              <h3 className="font-display text-lg font-bold">Review these</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {missed.map((q) => (
                  <li key={q.id}>
                    <a
                      href={`#q-${q.n}`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-cream px-3 py-1 text-[13px] font-semibold text-stone-700 hover:border-amber"
                    >
                      <span className="font-mono">Q{q.n}</span> {q.topic}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <SparkyBubble size="md" pose="graduation" className="mt-5">
              <p>Perfect score. The real exam asks a lot more than twenty — keep the streak going in the app.</p>
            </SparkyBubble>
          )}

          <div className="mt-7 rounded-2xl bg-stone-900 p-5 text-white sm:p-6">
            <p className="font-display text-xl font-bold">Want the full {QUESTION_COUNT_LABEL}?</p>
            <p className="mt-1 text-[15px] text-stone-300">
              Every question in the SparkyPass app is explained the same way, with the code section for the 2023 and 2026
              NEC. Seven-day free trial on the App Store.
            </p>
            <div className="-ml-3 mt-3">
              <AppStoreBadge height={48} placement="results" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {siblings.map((s) => (
              <Link
                key={s.slug}
                href={s.href}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 py-2 text-[14px] font-semibold text-foreground hover:border-amber"
              >
                Practice test {s.number}: {s.title}
              </Link>
            ))}
            <button
              type="button"
              onClick={reset}
              className="ml-auto min-h-11 text-[14px] font-semibold text-stone-600 underline-offset-4 hover:text-foreground hover:underline"
            >
              Reset this test
            </button>
          </div>
        </section>
      ) : answeredCount > 0 ? (
        <p className="mt-6 text-center text-[14px] text-stone-600">
          {total - answeredCount} to go.{" "}
          <button type="button" onClick={reset} className="min-h-11 font-semibold underline-offset-4 hover:underline">
            Start over
          </button>
        </p>
      ) : null}
    </div>
  );
}
