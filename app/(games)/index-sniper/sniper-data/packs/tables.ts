import type { SniperPack } from "../types";

export const tablesPack: SniperPack = {
  id: "tables",
  name: "NEC Tables",
  cards: [
    // ─── From free pack ───────────────────────────────────────────────
    {
      id: "ec-wire-ampacity",
      term: "Wire Ampacity",
      reference: "Table 310.16",
      description: "Allowable ampacities for standard insulated wires.",
      deck: "everyday-carry",
    },
    {
      id: "ec-burial-depth-trench",
      term: "Burial Depth / Trench",
      reference: "Table 300.5",
      description: "Minimum cover requirements for underground wiring.",
      deck: "everyday-carry",
    },
    // ─── From pack-4 ─────────────────────────────────────────────────
    {
      id: "ec-receptacle-rating-by-circuit-size",
      term: "Receptacle Rating by Circuit Size",
      reference: "Table 210.21(B)(3)",
      description:
        "Matching receptacle ampere ratings to branch circuit ratings.",
      deck: "everyday-carry",
    },
    {
      id: "ec-securing-pvc",
      term: "Securing PVC",
      reference: "Table 352.30",
      description:
        "Support spacing intervals for rigid nonmetallic conduit.",
      deck: "everyday-carry",
    },
    // ─── From pack-5 ─────────────────────────────────────────────────
    {
      id: "ec-branch-circuit-requirements",
      term: "Branch Circuit Requirements",
      reference: "Table 210.24",
      description:
        "Summary table of tap conductor sizing and circuit load limits.",
      deck: "everyday-carry",
    },
    // ─── From pack-8 ─────────────────────────────────────────────────
    {
      id: "ec-conductor-support-in-vertical-raceways",
      term: "Conductor Support in Vertical Raceways",
      reference: "Table 300.19(A)",
      description:
        "Intervals for supporting conductors in a vertical raceway.",
      deck: "everyday-carry",
    },
    // ─── From pack-10 ────────────────────────────────────────────────
    {
      id: "cm-egc-size",
      term: "EGC Size (Equip. Ground)",
      reference: "Table 250.122",
      description:
        "Sizing the ground wire based on the overcurrent device.",
      deck: "code-math",
    },
    {
      id: "cm-gec-size",
      term: "GEC Size (Electrode Ground)",
      reference: "Table 250.66",
      description:
        "Sizing the ground wire to the earth based on service conductors.",
      deck: "code-math",
    },
    {
      id: "cm-3-phase-motor-flc",
      term: "3-Phase Motor FLC",
      reference: "Table 430.250",
      description: "Finding the Full-Load Current for 3-phase motors.",
      deck: "code-math",
    },
    {
      id: "cm-1-phase-motor-flc",
      term: "1-Phase Motor FLC",
      reference: "Table 430.248",
      description:
        "Finding the Full-Load Current for single-phase motors.",
      deck: "code-math",
    },
    {
      id: "cm-motor-short-circuit-protection",
      term: "Motor Short-Circuit Protection",
      reference: "Table 430.52",
      description:
        "Maximum rating for motor branch-circuit short-circuit devices.",
      deck: "code-math",
    },
    {
      id: "cm-range-calculation-residential",
      term: "Range Calculation (Residential)",
      reference: "Table 220.55",
      description: "Demand factors for household electric ranges.",
      deck: "code-math",
    },
    {
      id: "cm-commercial-kitchen-equipment",
      term: "Commercial Kitchen Equipment",
      reference: "Table 220.56",
      description: "Demand factors for commercial cooking equipment.",
      deck: "code-math",
    },
    // ─── From pack-11 ────────────────────────────────────────────────
    {
      id: "cm-dryer-demand-factor",
      term: "Dryer Demand Factor",
      reference: "Table 220.54",
      description:
        "Demand factors for household electric clothes dryers.",
      deck: "code-math",
    },
    {
      id: "cm-general-lighting-load",
      term: "General Lighting Load",
      reference: "Table 220.12",
      description:
        "The VA per square foot requirements by occupancy type.",
      deck: "code-math",
    },
    {
      id: "cm-derating-more-than-3-wires",
      term: "Derating (More than 3 Wires)",
      reference: "Table 310.15(C)(1)",
      description:
        "Ampacity adjustment factors for bundling conductors.",
      deck: "code-math",
    },
    {
      id: "cm-temp-correction-factors",
      term: "Temp Correction Factors",
      reference: "Table 310.15(B)(1)",
      description:
        "Ampacity correction for ambient temperatures.",
      deck: "code-math",
    },
    // ─── From pack-12 ────────────────────────────────────────────────
    {
      id: "cm-transformer-overcurrent",
      term: "Transformer Overcurrent",
      reference: "Table 450.3(B)",
      description:
        "Primary and secondary protection sizing for transformers.",
      deck: "code-math",
    },
    {
      id: "cm-system-bonding-jumper-sizing",
      term: "System Bonding Jumper Sizing",
      reference: "Table 250.102(C)(1)",
      description: "Sizing the main or system bonding jumper.",
      deck: "code-math",
    },
    {
      id: "cm-volume-allowance-per-conductor",
      term: "Volume Allowance per Conductor",
      reference: "Table 314.16(B)",
      description:
        "The cubic inch requirements for different wire sizes.",
      deck: "code-math",
    },
    {
      id: "cm-motor-locked-rotor-current",
      term: "Motor Locked-Rotor Current",
      reference: "Table 430.251(B)",
      description:
        "Finding the locked-rotor current for 3-phase motors.",
      deck: "code-math",
    },
    {
      id: "cm-feeder-demand-for-lighting",
      term: "Feeder Demand for Lighting",
      reference: "Table 220.42",
      description:
        "Applying demand factors to general lighting loads.",
      deck: "code-math",
    },
    {
      id: "cm-receptacle-demand-factors",
      term: "Receptacle Demand Factors",
      reference: "Table 220.44",
      description:
        "Applying demand factors to non-dwelling receptacle loads.",
      deck: "code-math",
    },
    // ─── From pack-13 ────────────────────────────────────────────────
    {
      id: "cm-farm-load-demand-factors",
      term: "Farm Load Demand Factors",
      reference: "Table 220.103",
      description:
        "Calculating total load for a farm with multiple buildings.",
      deck: "code-math",
    },
    {
      id: "cm-rv-park-demand-factors",
      term: "RV Park Demand Factors",
      reference: "Table 551.73(A)",
      description:
        "Demand factors for recreational vehicle park electrical systems.",
      deck: "code-math",
    },
    {
      id: "cm-flexible-cords-ampacity",
      term: "Flexible Cords Ampacity",
      reference: "Table 400.5(A)(1)",
      description:
        "Finding the allowable ampacity for common flexible cords.",
      deck: "code-math",
    },
    {
      id: "cm-fixture-wires-ampacity",
      term: "Fixture Wires Ampacity",
      reference: "Table 402.5",
      description:
        "Finding the allowable ampacity for fixture wires.",
      deck: "code-math",
    },
    // ─── From pack-14 ────────────────────────────────────────────────
    {
      id: "cm-elevator-feeder-demand",
      term: "Elevator Feeder Demand",
      reference: "Table 620.14",
      description:
        "Demand factors based on the number of elevators on a single feeder.",
      deck: "code-math",
    },
    {
      id: "cm-clear-working-space-depth",
      term: "Clear Working Space Depth",
      reference: "Table 110.26(A)(1)",
      description:
        "Calculating depth based on Voltage and Conditions (1, 2, or 3).",
      deck: "code-math",
    },
    // ─── From pack-15 ────────────────────────────────────────────────
    {
      id: "cm-wire-bending-space-at-terminals",
      term: "Wire Bending Space at Terminals",
      reference: "Table 312.6(A)",
      description:
        "Sizing the required gutter space inside panels and enclosures.",
      deck: "code-math",
    },
    // ─── From pack-16 ────────────────────────────────────────────────
    {
      id: "cm-marina-shore-power-demand",
      term: "Marina Shore Power Demand",
      reference: "Table 555.53",
      description:
        "Demand factors based on the total number of receptacles on the dock.",
      deck: "code-math",
    },
    // ─── From pack-17 ────────────────────────────────────────────────
    {
      id: "cm-wound-rotor-secondary-current",
      term: "Wound-Rotor Secondary Current",
      reference: "Table 430.252",
      description:
        "Finding the secondary full-load current for wound-rotor motors.",
      deck: "code-math",
    },
    // ─── From pack-18 ────────────────────────────────────────────────
    {
      id: "cm-schools-demand-factors",
      term: "Schools Demand Factors",
      reference: "Table 220.86",
      description:
        "Optional method for calculating demand for schools based on total area.",
      deck: "code-math",
    },
    {
      id: "cm-restaurant-demand-factors",
      term: "Restaurant Demand Factors",
      reference: "Table 220.88",
      description:
        "Optional method for sizing service loads in new restaurants.",
      deck: "code-math",
    },
    {
      id: "cm-mobile-home-park-demand",
      term: "Mobile Home Park Demand",
      reference: "Table 550.31",
      description:
        "Demand factors based on the total number of mobile home lots.",
      deck: "code-math",
    },
    // ─── From pack-19 ────────────────────────────────────────────────
    {
      id: "cm-transformers-over-1000v",
      term: "Transformers Over 1000V",
      reference: "Table 450.3(A)",
      description:
        "Maximum rating of overcurrent protection for high-voltage transformers.",
      deck: "code-math",
    },
    {
      id: "cm-swimming-pool-overhead-clearances",
      term: "Swimming Pool Overhead Clearances",
      reference: "Table 680.8(A)",
      description:
        "Required clearance distances for utility lines over and around a pool.",
      deck: "code-math",
    },
    {
      id: "cm-resistance-welders-duty-cycle",
      term: "Resistance Welders Duty Cycle",
      reference: "Table 630.31(A)(2)",
      description:
        "Using duty cycle multipliers to size conductors for spot/resistance welders.",
      deck: "code-math",
    },
    {
      id: "cm-high-voltage-workspace-depth",
      term: "High-Voltage Workspace Depth",
      reference: "Table 110.34(A)",
      description:
        "Depth of clear workspace required for equipment operating over 1000 Volts.",
      deck: "code-math",
    },
    // ─── From pack-20 ────────────────────────────────────────────────
    {
      id: "cm-crane-and-hoist-motors",
      term: "Crane & Hoist Motors",
      reference: "Table 610.14(A)",
      description:
        "Sizing supply conductors for crane motors based on 15-, 30-, or 60-minute time ratings.",
      deck: "code-math",
    },
    {
      id: "cm-wound-rotor-resistors",
      term: "Wound-Rotor Resistors",
      reference: "Table 430.23(C)",
      description:
        "Sizing ampacity of conductors between a controller and resistors based on duty.",
      deck: "code-math",
    },
    {
      id: "cm-intermittent-duty-motors",
      term: "Intermittent Duty Motors",
      reference: "Table 430.22(E)",
      description:
        "Using nameplate current multipliers for varying, short-time, or periodic duty.",
      deck: "code-math",
    },
    // ─── From pack-21 ────────────────────────────────────────────────
    {
      id: "cm-lighting-load-demand-hospitals",
      term: "Lighting Load Demand (Hospitals)",
      reference: "Table 220.42",
      description:
        "Applying specific demand factors to general lighting loads in hospital facilities.",
      deck: "code-math",
    },
  ],
};
