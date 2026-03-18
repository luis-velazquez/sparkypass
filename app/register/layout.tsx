import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Free Account",
  description:
    "Sign up for SparkyPass and start your 7-day free trial. No credit card required. Get instant access to NEC practice quizzes, mini-games, flashcards, and mock exams.",
  openGraph: {
    title: "Start Your Free Trial — SparkyPass",
    description:
      "Create your free account and get 7 days of full access to gamified NEC exam prep. No credit card required.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
