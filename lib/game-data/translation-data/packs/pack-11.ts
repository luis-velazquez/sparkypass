import type { TranslationPack } from "../types";

export const pack11: TranslationPack = {
  id: "pack-11",
  name: "NEC Tables Pack",
  cards: [
    {
      id: "te-pipe-fill-chart",
      slang: "Pipe Fill Chart",
      officialTerm: "Percent of Cross Section for Conduit Fill",
      reference: "Chapter 9, Table 1",
      description:
        'Translating slang to "Percent of Cross Section for Conduit Fill" — 1 wire 53%, 2 wires 31%, 3+ wires 40%.',
    },
    {
      id: "te-box-fill-chart",
      slang: "Box Fill Count",
      officialTerm: "Box Volume Allowances per Conductor",
      reference: "Table 314.16(B)",
      description:
        'Translating slang to "Box Volume Allowances per Conductor" for sizing outlet boxes.',
    },
    {
      id: "te-derating-table",
      slang: "Derating Table",
      officialTerm: "Adjustment Factors for More Than Three Current-Carrying Conductors",
      reference: "Table 310.15(C)(1)",
      description:
        'Translating slang to "Adjustment Factors for More Than Three Current-Carrying Conductors" in a raceway.',
    },
    {
      id: "te-motor-table",
      slang: "Motor Table",
      officialTerm: "Full-Load Current, Single-Phase AC Motors",
      reference: "Table 430.248",
      description:
        'Translating slang to "Full-Load Current, Single-Phase AC Motors" for sizing conductors and OCPD.',
    },
    {
      id: "te-ground-wire-chart",
      slang: "Ground Wire Chart",
      officialTerm: "Minimum Size Equipment Grounding Conductors",
      reference: "Table 250.122",
      description:
        'Translating slang to "Minimum Size Equipment Grounding Conductors" based on OCPD rating.',
    },
    {
      id: "te-gec-table",
      slang: "GEC Table",
      officialTerm: "Grounding Electrode Conductor Sizing",
      reference: "Table 250.66",
      description:
        'Translating slang to "Grounding Electrode Conductor Sizing" based on largest service conductor.',
    },
    {
      id: "te-range-table",
      slang: "Range Table / Cooking Demand",
      officialTerm: "Demand Factors for Household Cooking Appliances",
      reference: "Table 220.55",
      description:
        'Translating slang to "Demand Factors for Household Cooking Appliances" — Column A/B/C method.',
    },
    {
      id: "te-va-per-sqft",
      slang: "VA per Square Foot",
      officialTerm: "General Lighting Loads by Occupancy",
      reference: "Table 220.12",
      description:
        'Translating slang to "General Lighting Loads by Occupancy" for calculating branch circuit loads.',
    },
    
  ],
};
