import type { SniperPack } from "../types";

export const pack12: SniperPack = {
  id: "pack-12",
  name: "Expansion Pack 12",
  cards: [
    {
      id: "cm-overcurrent-device-next-size-up",
      term: "Overcurrent Device (Next Size Up)",
      reference: "240.4(B)",
      description: "Permitted to use next standard size OCPD when conductor ampacity falls between standard ratings.",
      deck: "code-math",
    },
    {
      id: "cm-the-tap-rules",
      term: "The Tap Rules",
      reference: "240.21(B)",
      description:
        "Rules for 10-foot, 25-foot, and outside feeder taps.",
      deck: "code-math",
    },
    {
      id: "cm-voltage-drop-recommendation",
      term: "Voltage Drop (Recommendation)",
      reference: "210.19(A) Info Note",
      description:
        "The 3% branch circuit / 5% total system recommendation.",
      deck: "code-math",
    },
    {
      id: "cm-bonding-jumper-at-service",
      term: "Bonding Jumper at Service",
      reference: "250.28",
      description: "Sizing the main bonding jumper based on the largest ungrounded service conductor.",
      deck: "code-math",
    },
    {
      id: "cm-box-fill-calculation-method",
      term: "Box Fill Calculation Method",
      reference: "314.16(B)",
      description: "Counting conductors, clamps, devices, and grounds for cubic inch box fill.",
      deck: "code-math",
    },
    {
      id: "cm-motor-overload-relay-sizing",
      term: "Motor Overload Relay Sizing",
      reference: "430.32(A)(1)",
      description: "Sizing separate overload protection at 115% or 125% of motor nameplate FLA.",
      deck: "code-math",
    },
    {
      id: "cm-lighting-demand-dwelling",
      term: "Lighting Demand (Dwelling)",
      reference: "220.42",
      description: "First 3000 VA at 100%, then 3001-120,000 VA at 35% for dwelling lighting.",
      deck: "code-math",
    },
    {
      id: "cm-receptacle-load-180va",
      term: "Receptacle Load (180 VA)",
      reference: "220.14(I)",
      description: "Each single, duplex, or triplex receptacle counts as 180 VA for load calculations.",
      deck: "code-math",
    },
    {
      id: "cm-neutral-load-calculation",
      term: "Neutral Load Calculation",
      reference: "220.61",
      description:
        "Calculating the maximum unbalanced neutral feeder load.",
      deck: "code-math",
    },
    {
      id: "cm-show-window-load",
      term: "Show Window Load",
      reference: "220.14(G)",
      description:
        "Calculating the 200 VA per linear foot requirement.",
      deck: "code-math",
    },
  ],
};
