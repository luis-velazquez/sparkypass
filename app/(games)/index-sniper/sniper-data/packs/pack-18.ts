import type { SniperPack } from "../types";

export const pack18: SniperPack = {
  id: "pack-18",
  name: "Expansion Pack 18",
  cards: [
    {
      id: "cm-school-load-optional",
      term: "School Load (Optional Method)",
      reference: "220.86",
      description: "Using the optional calculation method for schools based on total connected load.",
      deck: "code-math",
    },
    {
      id: "cm-restaurant-load-optional",
      term: "Restaurant Load (Optional Method)",
      reference: "220.88",
      description: "Using the optional calculation method for restaurants based on total connected load.",
      deck: "code-math",
    },
    {
      id: "cm-mobile-home-park-feeder",
      term: "Mobile Home Park Feeder",
      reference: "550.31",
      description: "Sizing the service and feeder for a mobile home park based on the number of lots.",
      deck: "code-math",
    },
    {
      id: "cm-cable-tray-fill-multiconductor",
      term: "Cable Tray Fill (Multiconductor)",
      reference: "392.22(A)",
      description:
        "Calculating maximum allowable fill area for cables 4/0 AWG and larger.",
      deck: "code-math",
    },
    {
      id: "cm-cable-tray-ampacity-derating",
      term: "Cable Tray Ampacity Derating",
      reference: "392.80(A)",
      description:
        "Adjusting conductor ampacities when cables are installed in a tray.",
      deck: "code-math",
    },
    {
      id: "cm-metal-wireway-fill-20-rule",
      term: "Metal Wireway Fill (20% Rule)",
      reference: "376.22(A)",
      description:
        "Sum of cross-sectional areas of conductors cannot exceed 20% of the wireway.",
      deck: "code-math",
    },
    {
      id: "cm-metal-wireway-ampacity-derating",
      term: "Metal Wireway Ampacity Derating",
      reference: "376.22(B)",
      description:
        "Derating is required when more than 30 current-carrying conductors are present.",
      deck: "code-math",
    },
    {
      id: "cm-metal-wireway-splice-fill-75",
      term: "Metal Wireway Splice Fill (75%)",
      reference: "376.56(A)",
      description:
        "Conductors and splices combined cannot exceed 75% of the wireway area.",
      deck: "code-math",
    },
    {
      id: "cm-nonmetallic-wireway-fill",
      term: "Nonmetallic Wireway Fill",
      reference: "378.22",
      description:
        "Using the same 20% fill rules for nonmetallic troughs and wireways.",
      deck: "code-math",
    },
    {
      id: "cm-auxiliary-gutter-conductor-fill",
      term: "Auxiliary Gutter Conductor Fill",
      reference: "366.22(A)",
      description:
        "The 20% conductor limit rule for sheet metal auxiliary gutters.",
      deck: "code-math",
    },
  ],
};
