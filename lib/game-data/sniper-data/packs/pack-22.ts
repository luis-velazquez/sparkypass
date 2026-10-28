import type { SniperPack } from "../types";

export const pack22: SniperPack = {
  id: "pack-22",
  name: "Expansion Pack 22",
  cards: [
    {
      id: "cm-rv-site-service",
      term: "RV Site Service",
      reference: "551.71",
      description:
        "Calculating the required distribution of 50A, 30A, and 20A receptacles in an RV park.",
      deck: "code-math",
    },
    {
      id: "cm-marina-shore-power",
      term: "Marina Shore Power",
      reference: "555.53",
      description:
        "Applying demand factors to size feeders based on the number of slips/receptacles.",
      deck: "code-math",
    },
    {
      id: "cm-solar-pv-system-sizing",
      term: "Solar PV System Sizing",
      reference: "690.8(B)",
      description:
        "Applying the standard 125% multiplier for continuous load to PV circuit currents.",
      deck: "code-math",
    },
  ],
};
