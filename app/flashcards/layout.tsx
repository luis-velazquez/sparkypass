import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEC Flashcards — Spaced Repetition Study System",
  description:
    "Master NEC formulas, code references, and definitions with spaced repetition flashcards. Smart review surfaces your weak spots at the perfect time. Based on the 2023 NEC.",
  openGraph: {
    title: "NEC Flashcards — SparkyPass",
    description:
      "Spaced repetition flashcards for NEC formulas, code references, and key definitions. Study smarter, not longer.",
  },
};

export default function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
