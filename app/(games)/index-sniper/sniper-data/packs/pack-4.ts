import type { SniperPack } from "../types";

export const pack4: SniperPack = {
  id: "pack-4",
  name: "Expansion Pack 4",
  cards: [
    {
      id: "ec-conductors-in-parallel",
      term: "Conductors in Parallel",
      reference: "310.10(G)",
      description:
        "The minimum 1/0 AWG rule for running parallel conductors.",
      deck: "everyday-carry",
    },
    {
      id: "ec-free-length-of-conductors",
      term: "Free Length of Conductors",
      reference: "300.14",
      description:
        "The minimum 6-inch rule for wire length left at boxes/enclosures.",
      deck: "everyday-carry",
    },
    {
      id: "ec-snap-switch-rating",
      term: "Snap Switch Rating",
      reference: "404.14",
      description: "AC general-use snap switch rating and usage rules.",
      deck: "everyday-carry",
    },
    {
      id: "ec-neutral-at-switch-loops",
      term: "Neutral at Switch Loops",
      reference: "404.2(C)",
      description:
        "Requirement for providing a grounded (neutral) conductor at switch locations.",
      deck: "everyday-carry",
    },
    {
      id: "ec-uses-permitted-for-nm-cable",
      term: "Uses Permitted for NM Cable",
      reference: "334.10",
      description:
        "Acceptable building types and locations for Romex.",
      deck: "everyday-carry",
    },
    {
      id: "ec-uses-not-permitted-for-nm-cable",
      term: "Uses Not Permitted for NM Cable",
      reference: "334.12",
      description:
        "Prohibited building types and locations for Romex.",
      deck: "everyday-carry",
    },
    {
      id: "ec-securing-emt",
      term: "Securing EMT",
      reference: "358.30(A)",
      description:
        "Fastening requirements for Electrical Metallic Tubing (3-foot/10-foot rules).",
      deck: "everyday-carry",
    },
    {
      id: "ec-ground-fault-protection-of-equipment",
      term: "Ground-Fault Protection of Equipment",
      reference: "230.95",
      description: "Required GFPE for services rated 1000A or more on 480Y/277V systems.",
      deck: "everyday-carry",
    },
    {
      id: "ec-temperature-differences-sealing",
      term: "Temperature Differences/Sealing",
      reference: "300.7(A)",
      description:
        "Requirement to seal raceways passing between different temperature zones.",
      deck: "everyday-carry",
    },
    {
      id: "ec-uses-not-permitted-for-flexible-cords",
      term: "Uses Not Permitted for Flexible Cords",
      reference: "400.12",
      description:
        "Prohibitions against using cords as substitute for fixed wiring.",
      deck: "everyday-carry",
    },
  ],
};
