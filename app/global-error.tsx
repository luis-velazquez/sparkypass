"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-200">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">&#9889;</div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-stone-400 mb-6">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
