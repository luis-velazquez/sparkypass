import type { SniperPack } from "../types";

export const pack13: SniperPack = {
  id: "pack-13",
  name: "Expansion Pack 13",
  cards: [
    {
      id: "cm-sign-outline-lighting-load",
      term: "Sign/Outline Lighting Load",
      reference: "220.14(F)",
      description:
        "The 1200 VA minimum load requirement for sign branch circuits.",
      deck: "code-math",
    },
    {
      id: "cm-multioutlet-assembly-load",
      term: "Multioutlet Assembly Load",
      reference: "220.14(H)",
      description:
        "Calculating load based on 1.5 ft vs 5 ft intervals.",
      deck: "code-math",
    },
    {
      id: "cm-heavy-duty-lampholder-load",
      term: "Heavy-Duty Lampholder Load",
      reference: "220.14(E)",
      description:
        "The 600 VA minimum load per heavy-duty fixture.",
      deck: "code-math",
    },
    {
      id: "cm-electric-range-demand",
      term: "Electric Range Demand",
      reference: "220.55",
      description: "Using demand factors (Column A/B/C) for household ranges based on number and kW rating.",
      deck: "code-math",
    },
    {
      id: "cm-cooking-equipment-note-4",
      term: "Cooking Equipment Note 4",
      reference: "220.55 Note 4",
      description: "Increasing Column C value by 5% for each kW that exceeds 12 kW.",
      deck: "code-math",
    },
    {
      id: "cm-mobile-home-load",
      term: "Mobile Home Load",
      reference: "550.18",
      description:
        "Load calculation methodology for mobile and manufactured homes.",
      deck: "code-math",
    },
    {
      id: "cm-flexible-cord-overcurrent",
      term: "Flexible Cord Overcurrent",
      reference: "240.5",
      description: "The overcurrent protection limits based on flexible cord ampacity ratings.",
      deck: "code-math",
    },
    {
      id: "cm-fixture-wire-overcurrent",
      term: "Fixture Wire Overcurrent",
      reference: "240.5(B)(2)",
      description: "The overcurrent protection limits for 18 AWG and 16 AWG fixture wires.",
      deck: "code-math",
    },
    {
      id: "cm-welders-ampacity-duty-cycle",
      term: "Welders Ampacity/Duty Cycle",
      reference: "630.11(A)",
      description:
        "Multipliers for arc welder supply conductors based on duty cycle.",
      deck: "code-math",
    },
    {
      id: "cm-ac-motor-compressor-circuit",
      term: "A/C Motor-Compressor Circuit",
      reference: "440.22",
      description:
        "Sizing short-circuit protection (175% or 225% rule) for hermetic motors.",
      deck: "code-math",
    },
  ],
};
