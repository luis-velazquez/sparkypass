import Link from "next/link";
import type { PracticeTest } from "@/data/practice-tests/types";
import { testPath } from "@/lib/practice-tests";

export function TestCard({ test }: { test: PracticeTest }) {
  const calc = test.questions.filter((q) => q.calculation).length;
  return (
    <Link
      href={testPath(test.slug)}
      className="group flex h-full flex-col rounded-3xl border border-border bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-amber/50 hover:shadow-elevated"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber font-mono text-[15px] font-bold text-stone-900">
          {test.number}
        </span>
        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-stone-600">
          {test.questions.length} questions · {calc} calc
        </span>
      </div>
      <h3 className="mt-4 font-display text-[22px] font-bold leading-tight tracking-tight text-foreground">{test.title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{test.blurb}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {test.focus.map((f) => (
          <li key={f} className="rounded-full bg-cream-dark px-2.5 py-1 text-[12px] font-semibold text-stone-600">
            {f}
          </li>
        ))}
      </ul>
      <span className="mt-auto pt-5 text-[15px] font-bold text-amber-text group-hover:underline group-hover:underline-offset-4">
        Start test {test.number} →
      </span>
    </Link>
  );
}
