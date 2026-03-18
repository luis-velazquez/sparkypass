import type { SniperPack } from "../types";

export const pack11: SniperPack = {
  id: "pack-11",
  name: "Expansion Pack 11",
  cards: [
    {
      id: "cm-small-appliance-load",
      term: "Small Appliance Load",
      reference: "220.52(A)",
      description: "Two or more 20A small-appliance branch circuits at 1500 VA each.",
      deck: "code-math",
    },
    {
      id: "cm-laundry-load-calculation",
      term: "Laundry Load Calculation",
      reference: "220.52(B)",
      description: "At least one 20A, 1500 VA laundry branch circuit required for dwelling.",
      deck: "code-math",
    },
    {
      id: "cm-track-lighting-load",
      term: "Track Lighting Load",
      reference: "220.43(B)",
      description:
        "Calculating the VA load for lighting track per linear foot.",
      deck: "code-math",
    },
    {
      id: "cm-continuous-load",
      term: "Continuous Load",
      reference: "210.20(A)",
      description:
        "The 125% multiplier rule for loads running 3+ hours.",
      deck: "code-math",
    },
    {
      id: "cm-optional-calc-dwelling",
      term: "Optional Calc Dwelling",
      reference: "220.82",
      description:
        "The simplified load calculation method for a single-family home.",
      deck: "code-math",
    },
    {
      id: "cm-multifamily-optional-calc",
      term: "Multifamily Optional Calc",
      reference: "220.84",
      description:
        "The simplified demand factors for multifamily dwelling units.",
      deck: "code-math",
    },
    {
      id: "cm-first-10kva-at-100-percent",
      term: "First 10 kVA at 100%",
      reference: "220.42",
      description: "Applying demand factors — first 10,000 VA at 100%, remainder at reduced percentages.",
      deck: "code-math",
    },
    {
      id: "cm-dwelling-dryer-load",
      term: "Dwelling Dryer Load",
      reference: "220.54",
      description: "5000 VA or nameplate rating (whichever larger) for each dryer in a dwelling.",
      deck: "code-math",
    },
    {
      id: "cm-pull-box-straight-pull",
      term: "Pull Box (Straight Pull)",
      reference: "314.28(A)(1)",
      description:
        'The "8 times the largest raceway" rule for sizing boxes.',
      deck: "code-math",
    },
    {
      id: "cm-pull-box-angle-pull",
      term: "Pull Box (Angle Pull)",
      reference: "314.28(A)(2)",
      description:
        'The "6 times the largest raceway" rule for sizing boxes.',
      deck: "code-math",
    },
  ],
};
