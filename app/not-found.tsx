import Link from "next/link";
import { SparkyMessage } from "@/components/sparky";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-20">
      <p className="text-8xl font-bold font-display text-amber/20 dark:text-sparky-green/10 mb-6 select-none">
        404
      </p>
      <SparkyMessage
        size="large"
        variant="sad"
        message="Whoa — looks like this circuit's open! The page you're looking for doesn't exist or has been moved. Let's get you back on track."
      />
      <div className="flex gap-4 mt-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 font-semibold px-6 py-3 transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg border border-border dark:border-stone-700 text-foreground dark:text-stone-300 hover:bg-muted dark:hover:bg-stone-800 font-semibold px-6 py-3 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
