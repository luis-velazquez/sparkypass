import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEC Practice Quizzes — Interactive Electrician Exam Questions",
  description:
    "500+ interactive NEC practice questions for the Texas Master Electrician exam. Instant feedback, detailed code references, and an Ohm's Law reward system. Based on the 2023 NEC.",
  openGraph: {
    title: "NEC Practice Quizzes — SparkyPass",
    description:
      "Test your NEC knowledge with 500+ interactive questions. Earn Watts, climb Voltage tiers, and track weak spots.",
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
