import type { SniperPack } from "../types";

export const pack1: SniperPack = {
  id: "pack-1",
  name: "Expansion Pack 1",
  cards: [
    {
      id: "ec-ground-rod-resistance",
      term: "Ground Rod Resistance",
      reference: "250.53(A)(2)",
      description:
        "The 25-ohm rule and the requirement for a supplemental rod.",
      deck: "everyday-carry",
    },
    {
      id: "ec-minimum-conductor-size",
      term: "Minimum Conductor Size",
      reference: "310.3",
      description:
        "The general rule that conductors shall not be smaller than 14 AWG.",
      deck: "everyday-carry",
    },
    {
      id: "ec-securing-nm-cable",
      term: "Securing NM Cable",
      reference: "334.30",
      description:
        "Securing distances (12 inches from box, every 4.5 feet) for Romex.",
      deck: "everyday-carry",
    },
    {
      id: "ec-securing-mc-cable",
      term: "Securing MC Cable",
      reference: "330.30",
      description:
        "Securing distances (12 inches from box, every 6 feet) for Metal-Clad.",
      deck: "everyday-carry",
    },
    {
      id: "ec-conduit-body-volume",
      term: "Conduit Body Volume (LBs)",
      reference: "314.16(C)",
      description: "Sizing requirements for short-radius conduit bodies.",
      deck: "everyday-carry",
    },
    {
      id: "ec-hvac-disconnect",
      term: "HVAC Disconnect",
      reference: "440.14",
      description:
        "Location and sight requirements for A/C unit disconnects.",
      deck: "everyday-carry",
    },
    {
      id: "ec-motor-disconnect-location",
      term: "Motor Disconnect Location",
      reference: "430.102(B)",
      description: '"In sight from" rules for motor disconnects.',
      deck: "everyday-carry",
    },
    {
      id: "ec-closet-luminaires",
      term: "Closet Luminaires",
      reference: "410.16",
      description: "Clearances for lighting fixtures in clothes closets.",
      deck: "everyday-carry",
    },
    {
      id: "ec-color-coding-branch-circuits",
      term: "Color Coding (Branch Circuits)",
      reference: "210.5",
      description:
        "Identification rules for ungrounded and grounded conductors.",
      deck: "everyday-carry",
    },
    {
      id: "ec-protection-from-physical-damage",
      term: "Protection from Physical Damage",
      reference: "300.4",
      description:
        "Rules for nail plates and drilling through wood/metal framing.",
      deck: "everyday-carry",
    },
  ],
};
