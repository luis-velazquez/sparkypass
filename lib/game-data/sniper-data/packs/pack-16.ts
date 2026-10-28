import type { SniperPack } from "../types";

export const pack16: SniperPack = {
  id: "pack-16",
  name: "Expansion Pack 16",
  cards: [
    {
      id: "cm-marina-feeder-calculation",
      term: "Marina Feeder Calculation",
      reference: "555.53",
      description: "Applying demand factors to marina/boatyard feeders based on total number of receptacles.",
      deck: "code-math",
    },
    {
      id: "cm-rv-park-site-ratios",
      term: "RV Park Site Ratios",
      reference: "551.71",
      description:
        "Requirement for 20% of sites to have 50A and 70% to have 30A receptacles.",
      deck: "code-math",
    },
    {
      id: "cm-neutral-sizing-dwelling-ranges",
      term: "Neutral Sizing (Dwelling Ranges)",
      reference: "220.61(B)(1)",
      description:
        "The feeder neutral can be sized at 70% of the calculated range load.",
      deck: "code-math",
    },
    {
      id: "cm-minimum-branch-circuit-for-ranges",
      term: "Minimum Branch Circuit for Ranges",
      reference: "210.19(A)(3)",
      description:
        "Ranges rated 8 3/4 kW or more require a minimum 40-amp branch circuit.",
      deck: "code-math",
    },
    {
      id: "cm-appliance-branch-circuit-size",
      term: "Appliance Branch Circuit Size",
      reference: "422.10(A)",
      description:
        "Sizing individual branch circuits for non-motor-operated appliances.",
      deck: "code-math",
    },
    {
      id: "cm-workspace-width",
      term: "Workspace Width",
      reference: "110.26(A)(2)",
      description:
        "Minimum width of 30 inches or the width of the equipment, whichever is greater.",
      deck: "code-math",
    },
    {
      id: "cm-ground-ring-size",
      term: "Ground Ring Size",
      reference: "250.52(A)(4)",
      description:
        "Minimum requirement of 2 AWG bare copper for a ground ring.",
      deck: "code-math",
    },
    {
      id: "cm-concrete-encased-electrode-size",
      term: "Concrete-Encased Electrode Size",
      reference: "250.52(A)(3)",
      description:
        "Minimum requirement of 4 AWG copper for a Ufer ground.",
      deck: "code-math",
    },
    {
      id: "cm-ground-rod-minimum-size",
      term: "Ground Rod Minimum Size",
      reference: "250.52(A)(5)",
      description:
        "Minimum physical dimensions of 5/8 inch diameter and 8 feet in length.",
      deck: "code-math",
    },
    {
      id: "cm-dwelling-lighting-load",
      term: "Dwelling Lighting Load",
      reference: "220.14(J)",
      description:
        "The 3 VA per square foot calculation for general dwelling unit lighting.",
      deck: "code-math",
    },
  ],
};
