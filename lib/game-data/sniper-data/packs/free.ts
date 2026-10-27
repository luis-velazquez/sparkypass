import type { SniperPack } from "../types";

export const freePack: SniperPack = {
  id: "free",
  name: "Starter Pack",
  cards: [
    // ─── Deck 1: Everyday Carry (110 cards) ───────────────────────────
    {
      id: "ec-box-fill",
      term: "Box Fill",
      reference: "314.16",
      description: "Sizing device boxes based on conductor count.",
      deck: "everyday-carry",
    },
    {
      id: "ec-bathroom-receptacle-placement",
      term: "Bathroom Receptacle Placement",
      reference: "210.52(D)",
      description: "Required receptacle within 36 inches of the outside edge of the lavatory basin.",
      deck: "everyday-carry",
    },
    {
      id: "ec-working-clearance",
      term: "Working Clearance",
      reference: "110.26(A)",
      description: "The 3-foot/36-inch rule for space around equipment.",
      deck: "everyday-carry",
    },
    {
      id: "ec-dedicated-equipment-space",
      term: "Dedicated Equipment Space",
      reference: "110.26(E)",
      description:
        "The footprint from the floor to the structural ceiling above panels.",
      deck: "everyday-carry",
    },
    {
      id: "ec-dwelling-unit-services-disconnect",
      term: "Dwelling Unit Services Disconnect",
      reference: "230.85",
      description: "The emergency disconnect requirement for one- and two-family dwellings.",
      deck: "everyday-carry",
    },
    {
      id: "ec-gfci-protection",
      term: "GFCI Protection",
      reference: "210.8",
      description: "The master list of all required GFCI locations.",
      deck: "everyday-carry",
    },
    {
      id: "ec-afci-protection",
      term: "AFCI Protection",
      reference: "210.12",
      description: "The master list of all required AFCI locations.",
      deck: "everyday-carry",
    },
    {
      id: "ec-tamper-resistant-receptacles",
      term: "Tamper-Resistant Receptacles",
      reference: "406.12",
      description:
        "Locations requiring TR receptacles (dwellings, schools, etc.).",
      deck: "everyday-carry",
    },
    {
      id: "ec-weather-resistant-receptacles",
      term: "Weather-Resistant Receptacles",
      reference: "406.9",
      description: "Rules for damp and wet location receptacles.",
      deck: "everyday-carry",
    },
    {
      id: "ec-standard-breaker-sizes",
      term: "Standard Breaker Sizes",
      reference: "240.6(A)",
      description:
        "The list of standard ampere ratings for fuses and breakers.",
      deck: "everyday-carry",
    },
    {
      id: "ec-kitchen-countertops",
      term: "Kitchen Countertops",
      reference: "210.52(C)",
      description:
        "Spacing and placement for residential countertop receptacles.",
      deck: "everyday-carry",
    },
    {
      id: "ec-wall-space-receptacles",
      term: "Wall Space Receptacles",
      reference: "210.52(A)(1)",
      description:
        "The 6-foot/12-foot rule for general dwelling receptacles.",
      deck: "everyday-carry",
    },
    {
      id: "ec-outdoor-receptacles",
      term: "Outdoor Receptacles",
      reference: "210.52(E)",
      description: "Grade-level and balcony receptacle requirements.",
      deck: "everyday-carry",
    },
    {
      id: "ec-bathroom-circuit",
      term: "Bathroom Circuit",
      reference: "210.11(C)(3)",
      description:
        "The 20-amp dedicated branch circuit rule for bathrooms.",
      deck: "everyday-carry",
    },
    {
      id: "ec-laundry-circuit",
      term: "Laundry Circuit",
      reference: "210.11(C)(2)",
      description:
        "The 20-amp dedicated branch circuit rule for laundry areas.",
      deck: "everyday-carry",
    },
    {
      id: "ec-garage-circuit",
      term: "Garage Circuit",
      reference: "210.11(C)(4)",
      description:
        "The 20-amp dedicated branch circuit rule for garages.",
      deck: "everyday-carry",
    },
    {
      id: "ec-number-of-services",
      term: "Number of Services",
      reference: "230.2",
      description:
        "The general rule of one service per building (and its exceptions).",
      deck: "everyday-carry",
    },
    {
      id: "ec-overhead-service-clearance",
      term: "Overhead Service Clearance",
      reference: "230.24",
      description:
        "Vertical clearances for service drops over roofs and driveways.",
      deck: "everyday-carry",
    },
    {
      id: "ec-max-number-of-disconnects",
      term: "Max Number of Disconnects",
      reference: "230.71",
      description:
        'The "six switches or breakers" rule for service equipment.',
      deck: "everyday-carry",
    },
    {
      id: "ec-grounding-electrode-system",
      term: "Grounding Electrode System",
      reference: "250.50",
      description:
        "The requirement to bond all available electrodes together.",
      deck: "everyday-carry",
    },
  ],
};
