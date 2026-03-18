import type { SniperPack } from "../types";

export const pack17: SniperPack = {
  id: "pack-17",
  name: "Expansion Pack 17",
  cards: [
    {
      id: "cm-sign-outline-branch-circuit",
      term: "Sign/Outline Branch Circuit",
      reference: "600.5(A)",
      description:
        "Minimum 20-amp rating requirement for commercial sign circuits.",
      deck: "code-math",
    },
    {
      id: "cm-phase-converter-ampacity",
      term: "Phase Converter Ampacity",
      reference: "455.6(A)",
      description:
        "Sizing conductors at 125% of the single-phase input full-load amperes.",
      deck: "code-math",
    },
    {
      id: "cm-wound-rotor-secondary-conductor",
      term: "Wound-Rotor Secondary Conductor",
      reference: "430.23",
      description: "Sizing secondary conductors for wound-rotor motors based on secondary FLC and duty.",
      deck: "code-math",
    },
    {
      id: "cm-single-motor-branch-circuit",
      term: "Single Motor Branch Circuit",
      reference: "430.22",
      description:
        "Sizing conductors at 125% of the motor full-load current rating.",
      deck: "code-math",
    },
    {
      id: "cm-motor-control-circuit-overcurrent",
      term: "Motor Control Circuit Overcurrent",
      reference: "430.72",
      description:
        "Sizing the overcurrent device for tapped motor control conductors.",
      deck: "code-math",
    },
    {
      id: "cm-generator-feeder-sizing",
      term: "Generator Feeder Sizing",
      reference: "445.13(A)",
      description:
        "Ampacity of conductors must not be less than 115% of the nameplate rating.",
      deck: "code-math",
    },
    {
      id: "cm-noncoincident-loads",
      term: "Noncoincident Loads",
      reference: "220.60",
      description:
        "The rule allowing you to drop the smaller of two loads that won't run together.",
      deck: "code-math",
    },
    {
      id: "cm-ac-vs-space-heating-load",
      term: "A/C vs Space Heating Load",
      reference: "220.50",
      description:
        "Calculate both loads at 100% but only use the larger one for the service size.",
      deck: "code-math",
    },
    {
      id: "cm-fixed-electric-space-heating-load",
      term: "Fixed Electric Space Heating Load",
      reference: "220.51",
      description: "Computed at 100% of the total connected load.",
      deck: "code-math",
    },
    {
      id: "cm-existing-installations-peak-data",
      term: "Existing Installations (Peak Data)",
      reference: "220.87",
      description:
        "Using a 1-year peak demand record to calculate loads for added capacity.",
      deck: "code-math",
    },
  ],
};
