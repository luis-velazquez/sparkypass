import type { SniperPack } from "../types";

export const pack19: SniperPack = {
  id: "pack-19",
  name: "Expansion Pack 19",
  cards: [
    {
      id: "cm-transformer-protection-primary-only",
      term: "Transformer Protection (Primary Only)",
      reference: "450.3(B)",
      description: "When primary-only protection is used, maximum OCPD depends on transformer impedance.",
      deck: "code-math",
    },
    {
      id: "cm-100-foot-tap-rule-manufacturing",
      term: "100-Foot Tap Rule (Manufacturing)",
      reference: "240.21(B)(4)",
      description:
        "Special tap rule solely for high-bay manufacturing buildings over 35 feet high.",
      deck: "code-math",
    },
    {
      id: "cm-secondary-tie-circuits",
      term: "Secondary Tie Circuits",
      reference: "450.6",
      description:
        "Sizing rules for tie circuits linking two or more transformer secondaries.",
      deck: "code-math",
    },
    {
      id: "cm-overcurrent-for-flexible-cords",
      term: "Overcurrent for Flexible Cords",
      reference: "240.5(B)",
      description:
        "Determining the maximum breaker size permitted to protect extension cords.",
      deck: "code-math",
    },
    {
      id: "cm-pool-bonding-requirements",
      term: "Pool Bonding Requirements",
      reference: "680.26",
      description: "Equipotential bonding grid requirements for swimming pools and similar installations.",
      deck: "code-math",
    },
    {
      id: "cm-snow-melting-equipment-continuous",
      term: "Snow Melting Equipment (Continuous)",
      reference: "426.4",
      description:
        "Sizing branch circuits for fixed outdoor deicing at 125% of total load.",
      deck: "code-math",
    },
    {
      id: "cm-pipeline-heating-equipment",
      term: "Pipeline Heating Equipment",
      reference: "427.4",
      description:
        "Sizing branch circuits for fixed pipe heating at 125% of total load.",
      deck: "code-math",
    },
    {
      id: "cm-resistance-welder-conductor",
      term: "Resistance Welder Conductor",
      reference: "630.31",
      description: "Sizing supply conductors for resistance welders based on duty cycle multipliers.",
      deck: "code-math",
    },
    {
      id: "cm-x-ray-equipment-momentary-rating",
      term: "X-Ray Equipment (Momentary Rating)",
      reference: "660.6(A)",
      description:
        "Sizing ampacity based on 50% of the momentary rating plus 100% of the long-time rating.",
      deck: "code-math",
    },
    {
      id: "cm-high-voltage-clearance-elevation",
      term: "High-Voltage Clearance Elevation",
      reference: "110.34(E)",
      description: "Minimum elevation of unguarded live parts operating above 1000 volts.",
      deck: "code-math",
    },
  ],
};
