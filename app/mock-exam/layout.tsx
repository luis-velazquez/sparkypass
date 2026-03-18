import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Electrician Exam — Timed NEC Practice Tests",
  description:
    "Take full-length timed practice tests that mirror the real Texas Master Electrician exam. No surprises on test day. Track your readiness score and know when you're prepared.",
  openGraph: {
    title: "Mock Electrician Exam — SparkyPass",
    description:
      "Timed practice tests mirroring the real Texas Master Electrician exam format. Know exactly when you're ready.",
  },
};

export default function MockExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
