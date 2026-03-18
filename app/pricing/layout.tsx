import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Quarterly, Yearly & Lifetime Plans",
  description:
    "SparkyPass plans start at $26.66/mo. Choose Quarterly ($79.99), Yearly ($299.99), or Lifetime ($499.99) access to NEC practice tests, mini-games, flashcards & mock exams. 7-day free trial included.",
  openGraph: {
    title: "SparkyPass Pricing — Electrician Exam Prep Plans",
    description:
      "Start free for 7 days. Plans from $26.66/mo — Quarterly, Yearly, or Lifetime access to gamified NEC exam prep.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
