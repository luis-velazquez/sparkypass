import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Top Electrician Exam Students",
  description:
    "See who's earning the most Watts on SparkyPass. Compete globally, climb tiers from Sub Panel to Transformer, and track your rank against other electrician exam students.",
  openGraph: {
    title: "Leaderboard — SparkyPass",
    description:
      "Global rankings for electrician exam prep. Compete with other students and climb the Watts leaderboard.",
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
