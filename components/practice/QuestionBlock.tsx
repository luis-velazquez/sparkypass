"use client";

import { useEffect, useRef } from "react";
import { CodeRef } from "@/components/site/CodeRef";
import { SparkyBubble } from "@/components/site/SparkyBubble";
import type { PracticeQuestion } from "@/data/practice-tests/types";

const LETTERS = ["A", "B", "C", "D"];

/** `chosen` is the option index, `REVEALED` when the reader asked to see the answer. */
export const REVEALED = -1;

export function QuestionBlock({
  q,
  total,
  chosen,
  onChoose,
  eyebrow,
  headingLevel = "h2",
}: {
  q: PracticeQuestion;
  total?: number;
  chosen: number | null;
  onChoose: (index: number) => void;
  /** Overrides the default "Question n of total" label. */
  eyebrow?: string;
  headingLevel?: "h2" | "h3";
}) {
  const answered = chosen !== null;
  const isCorrect = chosen === q.answer;
  const Heading = headingLevel;
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  // Once the reader commits, move focus to the verdict so keyboard and
  // screen-reader users land on the feedback instead of a now-inert button.
  useEffect(() => {
    if (answered) feedbackRef.current?.focus({ preventScroll: true });
  }, [answered]);

  const verdict = !answered
    ? ""
    : chosen === REVEALED
      ? `The answer is ${LETTERS[q.answer]}: ${q.options[q.answer]}.`
      : isCorrect
        ? "Correct."
        : `Not quite. The answer is ${LETTERS[q.answer]}: ${q.options[q.answer]}.`;

  return (
    <article
      id={`q-${q.n}`}
      className="scroll-mt-44 rounded-2xl border border-border bg-white p-5 shadow-card sm:scroll-mt-40 sm:p-6"
      aria-labelledby={`q-${q.n}-prompt`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-stone-600">
          {eyebrow ?? `Question ${q.n}${total ? ` of ${total}` : ""}`}
        </span>
        <span className="rounded-full bg-cream-dark px-2.5 py-0.5 text-[12px] font-semibold text-stone-600">{q.topic}</span>
        {q.calculation ? (
          <span className="rounded-full bg-purple-soft px-2.5 py-0.5 text-[12px] font-semibold text-purple-dark">Calculation</span>
        ) : null}
      </div>

      <Heading
        id={`q-${q.n}-prompt`}
        tabIndex={-1}
        className="font-body text-[17px] font-semibold leading-snug text-foreground outline-none sm:text-lg"
      >
        {q.prompt}
      </Heading>

      <div role="group" aria-label="Answer choices" className="mt-4 space-y-2">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer;
          const isPick = chosen === i;
          let tone = "border-border bg-white hover:border-amber hover:bg-amber/5";
          if (answered) {
            if (isAnswer) tone = "border-emerald-600 bg-emerald-lighter text-emerald-800 animate-correct-flash";
            else if (isPick) tone = "border-red-500 bg-error-light text-red-700";
            else tone = "border-border bg-white text-stone-600";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!answered) onChoose(i);
              }}
              aria-disabled={answered}
              aria-pressed={isPick}
              className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-[15px] leading-snug transition-colors aria-disabled:cursor-default sm:text-base ${tone}`}
            >
              <span
                className={`mt-px inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[13px] font-bold ${
                  answered && isAnswer
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : answered && isPick
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-border bg-cream text-stone-600"
                }`}
              >
                {LETTERS[i]}
              </span>
              <span className="flex-1">{opt}</span>
              {answered && isAnswer ? <span className="sr-only">(correct answer)</span> : null}
            </button>
          );
        })}
      </div>

      {!answered ? (
        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={() => onChoose(REVEALED)}
            className="text-[13px] font-semibold text-stone-600 underline-offset-4 hover:text-foreground hover:underline"
          >
            Show the answer
          </button>
        </div>
      ) : null}

      {/* Persistent status region so assistive tech is told the verdict when it changes. */}
      <p
        ref={feedbackRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={`font-semibold outline-none ${answered ? "mt-4 border-t border-border pt-4" : "sr-only"} ${
          !answered ? "" : chosen === REVEALED ? "text-stone-700" : isCorrect ? "text-emerald-800" : "text-red-700"
        }`}
      >
        {verdict}
      </p>

      {/* Explanation is always in the HTML (it is the study content); hidden until the reader commits. */}
      <div hidden={!answered} className={answered ? "animate-reveal mt-3 space-y-3" : undefined}>
        <CodeRef ref2023={q.ref2023} ref2026={q.ref2026} />
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700 sm:text-base">{q.explanation}</p>
        <SparkyBubble size="sm" pose={answered && !isCorrect && chosen !== REVEALED ? "thinking" : "vest"}>
          <p className="whitespace-pre-line">{q.tip}</p>
        </SparkyBubble>
      </div>
    </article>
  );
}
