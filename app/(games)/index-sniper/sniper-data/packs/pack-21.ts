import type { SniperPack } from "../types";

export const pack21: SniperPack = {
  id: "pack-21",
  name: "Expansion Pack 21",
  cards: [
    {
      id: "cm-neutral-sizing-services",
      term: "Neutral Sizing (Services)",
      reference: "250.24(D)",
      description:
        "Minimum routing and sizing of the grounded conductor to the service equipment.",
      deck: "code-math",
    },
    {
      id: "cm-hospital-lighting-demand",
      term: "Hospital Lighting Demand",
      reference: "220.42",
      description: "The 50,000 VA threshold where hospital lighting loads get reduced demand percentages.",
      deck: "code-math",
    },
    {
      id: "cm-show-window-receptacles",
      term: "Show Window Receptacles",
      reference: "210.62",
      description:
        "The requirement of at least 1 receptacle per 12 linear feet of show window space.",
      deck: "code-math",
    },
    {
      id: "cm-sign-branch-circuit-sizing",
      term: "Sign Branch Circuit Sizing",
      reference: "600.5(B)",
      description:
        "The 20-amp minimum and the 125% continuous load requirement for sign circuits.",
      deck: "code-math",
    },
    {
      id: "cm-welder-supply-conductors-motor-generator",
      term: "Welder Supply Conductors (Motor-Generator)",
      reference: "630.11(A)",
      description:
        "Sizing the primary conductors based on the nameplate rating and duty cycle.",
      deck: "code-math",
    },
    {
      id: "cm-transformer-secondary-tie",
      term: "Transformer Secondary Tie",
      reference: "450.6",
      description:
        "Ampacity sizing rules for circuits connecting two or more transformer secondaries.",
      deck: "code-math",
    },
    {
      id: "cm-receptacle-load-non-dwelling",
      term: "Receptacle Load (Non-Dwelling)",
      reference: "220.14(I)",
      description:
        "Calculating 180 VA for each single or multiple receptacle on a single yoke/strap.",
      deck: "code-math",
    },
    {
      id: "cm-multioutlet-assembly-heavy-use",
      term: "Multioutlet Assembly (Heavy Use)",
      reference: "220.14(H)",
      description:
        "Calculating load at 180 VA for every 1.5 feet where appliances are likely to be used simultaneously.",
      deck: "code-math",
    },
    {
      id: "cm-multioutlet-assembly-light-use",
      term: "Multioutlet Assembly (Light Use)",
      reference: "220.14(H)",
      description:
        "Calculating load at 180 VA for every 5 feet where appliances will not be used simultaneously.",
      deck: "code-math",
    },
    {
      id: "cm-mobile-home-service",
      term: "Mobile Home Service",
      reference: "550.32(C)",
      description:
        "The minimum 100-ampere rating requirement for mobile home service equipment.",
      deck: "code-math",
    },
  ],
};
