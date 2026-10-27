"use client";

import { useState } from "react";
import Link from "next/link";
import { QuestionBlock } from "@/components/practice/QuestionBlock";
import type { PracticeQuestion } from "@/data/practice-tests/types";
import { APP_STORE_URL } from "@/lib/site";

/**
 * The hero's live question: one real question from the free tests, answerable
 * in place. After the reader commits, the explanation, code reference and tip
 * appear exactly as they do in the app, followed by the two next steps.
 */
export function HeroQuestion({ q, testHref }: { q: PracticeQuestion; testHref: string }) {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div>
      <QuestionBlock q={q} chosen={chosen} onChoose={setChosen} eyebrow="Try one · Journeyman" headingLevel="h2" />
      {chosen !== null ? (
        <div className="animate-reveal mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[14px] font-semibold">
          <Link href={testHref} className="text-amber-text underline-offset-4 hover:underline">
            Take the full 20-question test →
          </Link>
          <a href={APP_STORE_URL} rel="noopener" className="text-stone-600 underline-offset-4 hover:text-foreground hover:underline">
            Get the full 550+ in the app
          </a>
        </div>
      ) : (
        <p className="mt-3 px-1 text-[13px] text-stone-600">Pick an answer to see the explanation and code section.</p>
      )}
    </div>
  );
}
