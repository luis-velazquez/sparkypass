import type { SniperPack } from "../types";

export const pack2: SniperPack = {
  id: "pack-2",
  name: "Expansion Pack 2",
  cards: [
    {
      id: "ec-mwbc-disconnect",
      term: "MWBC Disconnect",
      reference: "210.4(B)",
      description:
        "Simultaneous disconnect rules for Multi-Wire Branch Circuits.",
      deck: "everyday-carry",
    },
    {
      id: "ec-receptacle-replacement",
      term: "Receptacle Replacement",
      reference: "406.4(D)",
      description:
        "Rules for replacing non-grounding type or old receptacles.",
      deck: "everyday-carry",
    },
    {
      id: "ec-island-peninsular-countertops",
      term: "Island/Peninsular Countertops",
      reference: "210.52(C)(2)",
      description:
        "Rules for receptacle placement on kitchen islands and peninsulas.",
      deck: "everyday-carry",
    },
    {
      id: "ec-working-space-illumination",
      term: "Working Space Illumination",
      reference: "110.26(D)",
      description: "Lighting requirements for electrical equipment rooms.",
      deck: "everyday-carry",
    },
    {
      id: "ec-working-space-headroom",
      term: "Working Space Headroom",
      reference: "110.26(A)(3)",
      description:
        "The 6.5-foot minimum headroom rule around service equipment.",
      deck: "everyday-carry",
    },
    {
      id: "ec-abandoned-cable-removal",
      term: "Abandoned Cable Removal",
      reference: "800.25",
      description:
        "Requirement to remove accessible abandoned communications wire.",
      deck: "everyday-carry",
    },
    {
      id: "ec-nm-cable-protection",
      term: "NM Cable Protection",
      reference: "334.15(B)",
      description:
        "Sleeving Romex in conduit where subject to physical damage.",
      deck: "everyday-carry",
    },
    {
      id: "ec-wet-location-covers",
      term: "Wet Location Covers",
      reference: "406.9(B)",
      description:
        '"In-use" or bubble cover requirements for wet locations.',
      deck: "everyday-carry",
    },
    {
      id: "ec-bathtub-luminaire-zone",
      term: "Bathtub Luminaire Zone",
      reference: "410.10(D)",
      description:
        "The 3-foot horizontal and 8-foot vertical clearance zone for fixtures.",
      deck: "everyday-carry",
    },
    {
      id: "ec-recessed-lighting-ic",
      term: "Recessed Lighting (IC)",
      reference: "410.116",
      description:
        "Clearances for Insulation Contact (IC) vs. Non-IC rated fixtures.",
      deck: "everyday-carry",
    },
  ],
};
