import type { SniperPack } from "../types";

export const pack3: SniperPack = {
  id: "pack-3",
  name: "Expansion Pack 3",
  cards: [
    {
      id: "ec-ceiling-fan-box-support",
      term: "Ceiling Fan Box Support",
      reference: "314.27(C)",
      description:
        "Outlet box listing and weight limits for paddle fans.",
      deck: "everyday-carry",
    },
    {
      id: "ec-splices-in-cabinets",
      term: "Splices in Cabinets",
      reference: "312.8(A)",
      description:
        "Rules for wire-nutting or passing through wires inside a panelboard.",
      deck: "everyday-carry",
    },
    {
      id: "ec-neutral-identification",
      term: "Neutral Identification",
      reference: "200.6",
      description:
        "Sizing and color rules for the grounded (neutral) conductor.",
      deck: "everyday-carry",
    },
    {
      id: "ec-ground-wire-identification",
      term: "Ground Wire Identification",
      reference: "250.119",
      description:
        "Sizing and color rules for the equipment grounding conductor.",
      deck: "everyday-carry",
    },
    {
      id: "ec-high-leg-identification",
      term: "High-Leg Identification",
      reference: "110.15",
      description:
        'The "orange wire" rule for 4-wire delta-connected systems.',
      deck: "everyday-carry",
    },
    {
      id: "ec-circuit-directory",
      term: "Circuit Directory",
      reference: "408.4(A)",
      description:
        "Requirement for accurate, legible panelboard labeling.",
      deck: "everyday-carry",
    },
    {
      id: "ec-closing-unused-openings",
      term: "Closing Unused Openings",
      reference: "110.12(A)",
      description:
        "Rules for plugging missing knockouts (KOs) in boxes and panels.",
      deck: "everyday-carry",
    },
    {
      id: "ec-plenum-wiring",
      term: "Plenum Wiring",
      reference: "300.22(C)",
      description:
        "Approved wiring methods for environmental air-handling spaces.",
      deck: "everyday-carry",
    },
    {
      id: "ec-appliance-disconnects",
      term: "Appliance Disconnects",
      reference: "422.31",
      description:
        "Location and lock-out requirements for hardwired appliances.",
      deck: "everyday-carry",
    },
    {
      id: "ec-sign-disconnects",
      term: "Sign Disconnects",
      reference: "600.6",
      description:
        "Disconnecting means requirements for outline lighting and signs.",
      deck: "everyday-carry",
    },
  ],
};
