import Link from "next/link";
import { SparkyBubble } from "@/components/site/SparkyBubble";
import { PRACTICE_HUB_PATH } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="select-none font-display text-8xl font-extrabold text-amber/25">404</p>
      <SparkyBubble pose="sad" size="lg" className="mt-6 text-left">
        <p>
          Looks like this circuit&apos;s open. The page you&apos;re looking for doesn&apos;t exist or has moved — the
          web app retired when SparkyPass moved to iPhone.
        </p>
      </SparkyBubble>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-amber px-6 py-3 font-bold text-stone-900 transition-colors hover:bg-amber-light"
        >
          Back to home
        </Link>
        <Link
          href={PRACTICE_HUB_PATH}
          className="inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3 font-bold text-foreground transition-colors hover:border-amber"
        >
          Free practice tests
        </Link>
      </div>
    </div>
  );
}
