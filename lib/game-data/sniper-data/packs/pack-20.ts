import type { SniperPack } from "../types";

export const pack20: SniperPack = {
  id: "pack-20",
  name: "Expansion Pack 20",
  cards: [
    {
      id: "cm-industrial-machinery-supply",
      term: "Industrial Machinery Supply",
      reference: "670.4(A)",
      description:
        "Sizing the feeder for a machine with multiple motors and heating loads.",
      deck: "code-math",
    },
    {
      id: "cm-audio-system-wire-sizing",
      term: "Audio System Wire Sizing",
      reference: "640.9",
      description:
        "Sizing conductors and amplifier output wiring for commercial audio systems.",
      deck: "code-math",
    },
    {
      id: "cm-crane-motor-conductor-sizing",
      term: "Crane Motor Conductor Sizing",
      reference: "610.14",
      description: "Sizing conductors for crane and hoist motors based on duty cycle time ratings.",
      deck: "code-math",
    },
    {
      id: "cm-motor-feeder-taps",
      term: "Motor Feeder Taps",
      reference: "430.28",
      description:
        "Sizing tap conductors specifically for motor feeders based on the 10/25 foot rules.",
      deck: "code-math",
    },
    {
      id: "cm-motor-compressor-branch-circuit",
      term: "Motor Compressor Branch Circuit",
      reference: "440.32",
      description:
        "Sizing conductors for a single motor-compressor at 125% of rated-load current.",
      deck: "code-math",
    },
    {
      id: "cm-wound-rotor-resistor-conductor",
      term: "Wound-Rotor Resistor Conductor",
      reference: "430.23(C)",
      description: "Sizing conductors between the secondary controller and starting resistors.",
      deck: "code-math",
    },
    {
      id: "cm-continuous-duty-motors",
      term: "Continuous Duty Motors",
      reference: "430.22",
      description:
        "The fundamental rule: Sizing conductors to a single continuous duty motor at 125% FLC.",
      deck: "code-math",
    },
    {
      id: "cm-intermittent-duty-motor-sizing",
      term: "Intermittent Duty Motor Sizing",
      reference: "430.22(E)",
      description: "Using nameplate current multipliers for short-time, intermittent, or periodic duty motors.",
      deck: "code-math",
    },
    {
      id: "cm-phase-converters-single-phase-input",
      term: "Phase Converters (Single-Phase input)",
      reference: "455.6(A)",
      description:
        "Sizing supply conductors at 125% of the phase converter's single-phase input FLC.",
      deck: "code-math",
    },
    {
      id: "cm-voltage-drop-feeders",
      term: "Voltage Drop (Feeders)",
      reference: "215.2(A)(1) Info Note 2",
      description:
        "The recommended maximum 3% voltage drop sizing threshold for feeders.",
      deck: "code-math",
    },
  ],
};
