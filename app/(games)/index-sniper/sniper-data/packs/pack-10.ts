import type { SniperPack } from "../types";

export const pack10: SniperPack = {
  id: "pack-10",
  name: "Expansion Pack 10",
  cards: [
    // ─── Deck 2: Code Math (123 cards) ────────────────────────────────
    {
      id: "cm-conduit-fill",
      term: "Conduit Fill %",
      reference: "Chapter 9, Table 4",
      description: "Finding the usable area inside raceways.",
      deck: "code-math",
    },
    {
      id: "cm-ac-vs-heat-comparison",
      term: "A/C vs Heat Comparison",
      reference: "220.60",
      description: "Using the larger of A/C or heating load, not both, when they are noncoincident.",
      deck: "code-math",
    },
    {
      id: "cm-largest-motor-25-percent",
      term: "Largest Motor 25%",
      reference: "430.24",
      description: "Adding 25% of the largest motor FLC to the sum of all other motor loads for feeder sizing.",
      deck: "code-math",
    },
    {
      id: "cm-motor-branch-circuit-conductor",
      term: "Motor Branch Circuit Conductor",
      reference: "430.22(A)",
      description: "Sizing the branch circuit conductor at 125% of a single motor's full-load current.",
      deck: "code-math",
    },
    {
      id: "cm-service-entrance-conductor-sizing",
      term: "Service Entrance Conductor Sizing",
      reference: "230.42(A)(1)",
      description: "Service conductors must have sufficient ampacity for the calculated load.",
      deck: "code-math",
    },
    {
      id: "cm-general-lighting-va-per-sqft",
      term: "General Lighting VA/sq ft",
      reference: "220.12",
      description: "Applying the unit VA per square foot for different occupancy types to calculate lighting load.",
      deck: "code-math",
    },
    {
      id: "cm-motor-overload-protection",
      term: "Motor Overload Protection",
      reference: "430.32",
      description:
        "Sizing the separate overload device (heaters) for continuous duty.",
      deck: "code-math",
    },
    {
      id: "cm-motor-feeder-sizing",
      term: "Motor Feeder Sizing",
      reference: "430.24",
      description:
        'The "125% of largest motor + sum of the rest" rule.',
      deck: "code-math",
    },
    {
      id: "cm-demand-factor-ranges-column-c",
      term: "Demand Factor Ranges (Column C)",
      reference: "220.55",
      description: "Using Column C demand factors for household ranges rated over 12 kW.",
      deck: "code-math",
    },
    {
      id: "cm-standard-calculation-dwelling",
      term: "Standard Calculation (Dwelling)",
      reference: "Article 220, Part III",
      description: "The standard step-by-step method for computing dwelling unit service loads.",
      deck: "code-math",
    },
  ],
};
