import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEC Load Calculator — Residential & Commercial (Article 220)",
  description:
    "Free NEC load calculator for residential and commercial calculations. Step-by-step Article 220 breakdowns with conductor sizing, GEC sizing, and demand factors. Based on the 2023 NEC.",
  openGraph: {
    title: "NEC Load Calculator — SparkyPass",
    description:
      "Residential and commercial NEC load calculators with step-by-step Article 220 breakdowns. Free to use.",
  },
};

export default function LoadCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
