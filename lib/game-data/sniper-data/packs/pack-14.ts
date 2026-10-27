import type { SniperPack } from "../types";

export const pack14: SniperPack = {
  id: "pack-14",
  name: "Expansion Pack 14",
  cards: [
    {
      id: "cm-elevator-motor-disconnect",
      term: "Elevator Motor Disconnect",
      reference: "620.51(A)",
      description: "Requirements for the elevator machine room disconnecting means.",
      deck: "code-math",
    },
    {
      id: "cm-fire-pump-voltage-drop",
      term: "Fire Pump Voltage Drop",
      reference: "695.7",
      description:
        "The strict 15% starting and 5% running voltage drop limits for fire pumps.",
      deck: "code-math",
    },
    {
      id: "cm-conductor-properties-area-ohms",
      term: "Conductor Properties (Area/Ohms)",
      reference: "Chapter 9, Table 8",
      description:
        "D.C. resistance and cross-sectional area for solid/stranded wires.",
      deck: "code-math",
    },
    {
      id: "cm-ac-resistance-and-reactance",
      term: "AC Resistance & Reactance",
      reference: "Chapter 9, Table 9",
      description:
        "Multiplying factors for finding AC resistance and voltage drop.",
      deck: "code-math",
    },
    {
      id: "cm-neutral-derating-harmonics",
      term: "Neutral Derating (Harmonics)",
      reference: "310.15(E)(3)",
      description:
        "Counting the neutral as a current-carrying conductor for non-linear loads.",
      deck: "code-math",
    },
    {
      id: "cm-parallel-egc-sizing",
      term: "Parallel EGC Sizing",
      reference: "250.122(F)",
      description:
        "Rules for sizing equipment grounding conductors in parallel raceways.",
      deck: "code-math",
    },
    {
      id: "cm-working-space-conditions",
      term: "Working Space Conditions",
      reference: "110.26(A)(1)",
      description: "Three conditions for determining the depth of clear working space based on voltage.",
      deck: "code-math",
    },
    {
      id: "cm-single-phase-dwelling-services",
      term: "Single-Phase Dwelling Services",
      reference: "310.12",
      description:
        "The 83% rule for sizing single-phase dwelling unit services and feeders.",
      deck: "code-math",
    },
    {
      id: "cm-small-conductor-rule",
      term: "Small Conductor Rule",
      reference: "240.4(D)",
      description:
        "The strict breaker limits for 14 AWG (15A), 12 AWG (20A), and 10 AWG (30A).",
      deck: "code-math",
    },
  ],
};
