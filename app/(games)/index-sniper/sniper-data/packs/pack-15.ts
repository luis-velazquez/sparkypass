import type { SniperPack } from "../types";

export const pack15: SniperPack = {
  id: "pack-15",
  name: "Expansion Pack 15",
  cards: [
    {
      id: "cm-gutter-space-at-cabinets",
      term: "Gutter Space at Cabinets",
      reference: "312.6",
      description: "Minimum wire bending space inside cabinets and cutout boxes based on conductor size.",
      deck: "code-math",
    },
    {
      id: "cm-10-foot-tap-rule-capacity",
      term: "10-Foot Tap Rule Capacity",
      reference: "240.21(B)(1)",
      description:
        "Conductors must not have an ampacity less than 1/10 of the OCPD rating.",
      deck: "code-math",
    },
    {
      id: "cm-25-foot-tap-rule-capacity",
      term: "25-Foot Tap Rule Capacity",
      reference: "240.21(B)(2)",
      description:
        "Conductors must not have an ampacity less than 1/3 of the OCPD rating.",
      deck: "code-math",
    },
    {
      id: "cm-motor-feeder-short-circuit-sizing",
      term: "Motor Feeder Short-Circuit Sizing",
      reference: "430.62(A)",
      description:
        "Largest motor branch-circuit OCPD plus the sum of all other motor FLCs.",
      deck: "code-math",
    },
    {
      id: "cm-capacitor-circuit-ampacity",
      term: "Capacitor Circuit Ampacity",
      reference: "460.8(A)",
      description:
        "Conductors must be sized at 135% of the capacitor's rated current.",
      deck: "code-math",
    },
    {
      id: "cm-evse-continuous-load",
      term: "EVSE Continuous Load",
      reference: "625.41",
      description:
        "Electric Vehicle charging equipment calculated at 125% of maximum load.",
      deck: "code-math",
    },
    {
      id: "cm-solar-pv-maximum-voltage",
      term: "Solar PV Maximum Voltage",
      reference: "690.7",
      description:
        "Calculating max DC voltage using cold temperature correction factors.",
      deck: "code-math",
    },
    {
      id: "cm-solar-pv-circuit-current",
      term: "Solar PV Circuit Current",
      reference: "690.8",
      description:
        "Sizing circuit current and applying the 125% continuous load multiplier.",
      deck: "code-math",
    },
    {
      id: "cm-fire-pump-locked-rotor-ocpd",
      term: "Fire Pump Locked-Rotor OCPD",
      reference: "695.4(B)(2)",
      description:
        "Overcurrent device must carry locked-rotor current indefinitely.",
      deck: "code-math",
    },
    {
      id: "cm-fixed-electric-space-heating",
      term: "Fixed Electric Space Heating",
      reference: "424.3(B)",
      description:
        "Branch circuits must be sized as continuous loads (125%).",
      deck: "code-math",
    },
  ],
};
