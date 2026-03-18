import type { FormulaPack } from "../types";

export const FREE_PACK: FormulaPack = {
  id: "free",
  name: "Starter Pack",
  scenarios: [
    // ── Easy (3 scenarios) ─────────────────────────────────────────────

    {
      id: "residential-standard",
      title: "Residential Service Load (Standard Method)",
      description:
        "Calculate a dwelling unit service load using the NEC standard method.",
      difficulty: "easy",
      steps: [
        {
          id: "res-std-1",
          label: "Table 220.12",
          description: "General lighting load at 3 VA/sq ft",
        },
        {
          id: "res-std-2",
          label: "Table 220.42",
          description: "Apply lighting demand factors",
        },
        {
          id: "res-std-3",
          label: "220.52",
          description: "Add small-appliance & laundry circuit loads",
        },
        {
          id: "res-std-4",
          label: "Table 220.55",
          description: "Apply range demand factor",
        },
        {
          id: "res-std-5",
          label: "Size Service",
          description: "Total VA \u00F7 voltage to determine service ampacity",
        },
      ],
      distractors: [
        {
          id: "res-std-d1",
          label: "Table 430.250",
          description: "Three-phase motor FLC lookup",
        },
        {
          id: "res-std-d2",
          label: "Table 220.56",
          description: "Commercial kitchen equipment demand",
        },
      ],
      explanation:
        "The standard method starts with general lighting (Table 220.12), applies demand factors (Table 220.42), adds the required small-appliance and laundry circuits (220.52), applies range demand (Table 220.55), then totals and sizes the service. Motor FLC and commercial kitchen tables do not apply to a basic residential calculation.",
    },

    {
      id: "single-motor-branch",
      title: "Single Motor Branch Circuit",
      description:
        "Size the branch-circuit conductors and protection for a single motor.",
      difficulty: "easy",
      steps: [
        {
          id: "motor-br-1",
          label: "Table 430.248/250",
          description: "Look up motor full-load current (FLC)",
        },
        {
          id: "motor-br-2",
          label: "430.22",
          description: "Multiply FLC by 125% for conductor sizing",
        },
        {
          id: "motor-br-3",
          label: "Table 310.16",
          description: "Select conductor based on ampacity",
        },
        {
          id: "motor-br-4",
          label: "Table 430.52",
          description: "Determine short-circuit & ground-fault protection size",
        },
      ],
      distractors: [
        {
          id: "motor-br-d1",
          label: "430.32",
          description: "Overload protection (separate from branch circuit)",
        },
        {
          id: "motor-br-d2",
          label: "Table 220.55",
          description: "Residential range demand factor",
        },
      ],
      explanation:
        "For a single motor branch circuit, first find the FLC from the applicable table (never use the nameplate), then apply 125% per 430.22 for conductor sizing, pick the wire from Table 310.16, and finally size the branch-circuit overcurrent device per Table 430.52. Overload protection (430.32) is a separate consideration from the branch circuit itself.",
    },

    {
      id: "dwelling-optional",
      title: "Dwelling Unit Optional Calculation",
      description:
        "Use the faster NEC 220.82 optional method for an existing dwelling.",
      difficulty: "easy",
      steps: [
        {
          id: "opt-1",
          label: "220.82(B)(1)",
          description: "General loads (lighting, small appliance, laundry) at 100%",
        },
        {
          id: "opt-2",
          label: "220.82(B)(2)",
          description: "Add all other loads (A/C, heat, appliances, motors)",
        },
        {
          id: "opt-3",
          label: "220.82(C)",
          description: "Apply demand: first 10 kVA at 100%, remainder at 40%",
        },
        {
          id: "opt-4",
          label: "Table 310.16",
          description: "Size service-entrance conductors",
        },
      ],
      distractors: [
        {
          id: "opt-d1",
          label: "Table 220.42",
          description: "Standard method lighting demand factors",
        },
        {
          id: "opt-d2",
          label: "220.84",
          description: "Multifamily dwelling optional calculation",
        },
      ],
      explanation:
        "The optional method (220.82) lumps general loads together at 100%, adds all other loads, then applies a single demand factor (first 10 kVA at 100%, remainder at 40%). This is simpler than the standard method and does not use Table 220.42 lighting demand factors. Section 220.84 is for multifamily buildings, not individual units.",
    },

    // ── Medium (4 scenarios) ───────────────────────────────────────────

    {
      id: "commercial-lighting-receptacle",
      title: "Commercial Lighting & Receptacle Load",
      description:
        "Calculate a commercial service load for lighting and receptacles.",
      difficulty: "medium",
      steps: [
        {
          id: "com-lr-1",
          label: "Table 220.12",
          description: "Determine VA/sq ft by occupancy type",
        },
        {
          id: "com-lr-2",
          label: "Table 220.42",
          description: "Apply lighting demand factors",
        },
        {
          id: "com-lr-3",
          label: "220.14(I)",
          description: "Calculate receptacle load at 180 VA each",
        },
        {
          id: "com-lr-4",
          label: "Table 220.44",
          description: "Apply receptacle demand factors",
        },
        {
          id: "com-lr-5",
          label: "Sum Total VA",
          description: "Combine demanded lighting and receptacle loads",
        },
        {
          id: "com-lr-6",
          label: "Size Service",
          description: "Total VA \u00F7 (V \u00D7 \u221A3) for three-phase service ampacity",
        },
      ],
      distractors: [
        {
          id: "com-lr-d1",
          label: "Table 220.55",
          description: "Residential range demand factor",
        },
        {
          id: "com-lr-d2",
          label: "220.82",
          description: "Dwelling unit optional calculation",
        },
        {
          id: "com-lr-d3",
          label: "Table 220.56",
          description: "Commercial kitchen equipment demand",
        },
      ],
      explanation:
        "Commercial lighting starts with the VA/sq ft from Table 220.12 for the occupancy type, then applies demand factors from Table 220.42. Receptacles are counted at 180 VA each per 220.14(I), then Table 220.44 demand (first 10 kVA at 100%, remainder at 50%) is applied. The loads are summed and divided by voltage to size the service. Residential range demand, dwelling optional, and kitchen equipment tables are not part of a basic lighting/receptacle calculation.",
    },

    {
      id: "motor-feeder",
      title: "Motor Feeder Sizing",
      description:
        "Size a feeder supplying multiple motors per Article 430.",
      difficulty: "medium",
      steps: [
        {
          id: "mf-1",
          label: "Table 430.248/250",
          description: "Look up FLC for each motor",
        },
        {
          id: "mf-2",
          label: "430.24",
          description: "125% of largest motor + sum of all other motors",
        },
        {
          id: "mf-3",
          label: "Table 310.16",
          description: "Select feeder conductor ampacity",
        },
        {
          id: "mf-4",
          label: "Table 250.122",
          description: "Size equipment grounding conductor",
        },
        {
          id: "mf-5",
          label: "430.62(A)",
          description: "Size feeder overcurrent protection device",
        },
      ],
      distractors: [
        {
          id: "mf-d1",
          label: "Table 430.52",
          description: "Branch-circuit short-circuit protection",
        },
        {
          id: "mf-d2",
          label: "440.22",
          description: "A/C compressor branch circuit",
        },
        {
          id: "mf-d3",
          label: "430.32",
          description: "Motor overload protection",
        },
      ],
      explanation:
        "A motor feeder calculation begins with the FLC of each motor from Table 430.248 or 250 (never nameplate). Per 430.24, the feeder ampacity must be at least 125% of the largest motor plus the sum of the rest. Conductors are picked from Table 310.16, the EGC is sized from Table 250.122, and the feeder OCPD is sized per 430.62(A). Branch-circuit protection (430.52) and overload (430.32) apply to individual branch circuits, not the feeder.",
    },

    {
      id: "conduit-fill",
      title: "Conduit Fill Calculation",
      description:
        "Determine the minimum conduit size for a group of conductors.",
      difficulty: "medium",
      steps: [
        {
          id: "cf-1",
          label: "Chapter 9, Table 5",
          description: "Find cross-sectional area per conductor",
        },
        {
          id: "cf-2",
          label: "Chapter 9, Table 1",
          description:
            "Determine fill percentage (1 wire 53%, 2 wires 31%, 3+ wires 40%)",
        },
        {
          id: "cf-3",
          label: "Chapter 9, Table 4",
          description: "Look up conduit internal area",
        },
        {
          id: "cf-4",
          label: "Select Conduit Size",
          description: "Pick smallest conduit whose usable area fits all conductors",
        },
      ],
      distractors: [
        {
          id: "cf-d1",
          label: "Annex C Tables",
          description: "Pre-calculated conduit fill shortcut lookup",
        },
        {
          id: "cf-d2",
          label: "Table 310.16",
          description: "Conductor ampacity (not area)",
        },
        {
          id: "cf-d3",
          label: "Chapter 9, Table 8",
          description: "DC resistance of conductors",
        },
      ],
      explanation:
        "Conduit fill starts by finding each conductor's area from Chapter 9, Table 5, then determining the allowable fill percentage from Table 1 based on the number of conductors. Table 4 provides the conduit's internal area, and you pick the smallest conduit whose usable area accommodates the total wire area. Annex C provides shortcut tables but only works for same-size conductors. Table 310.16 is for ampacity, and Table 8 is for resistance \u2014 neither helps with physical fill.",
    },

    {
      id: "transformer-secondary",
      title: "Transformer Secondary Protection",
      description:
        "Size secondary overcurrent protection for a transformer rated 1000V or less.",
      difficulty: "medium",
      steps: [
        {
          id: "ts-1",
          label: "Nameplate kVA & Voltage",
          description: "Identify transformer rating and secondary voltage",
        },
        {
          id: "ts-2",
          label: "Calculate Secondary FLA",
          description: "kVA \u00D7 1000 \u00F7 (V \u00D7 \u221A3 for 3\u03C6, or V for 1\u03C6)",
        },
        {
          id: "ts-3",
          label: "Table 450.3(B)",
          description: "Determine maximum OCPD percentage for secondary protection",
        },
        {
          id: "ts-4",
          label: "240.6(A)",
          description: "Round to standard overcurrent device size",
        },
        {
          id: "ts-5",
          label: "Table 310.16",
          description: "Size secondary conductors for the load",
        },
      ],
      distractors: [
        {
          id: "ts-d1",
          label: "Table 450.3(A)",
          description: "Transformers over 1000 V (not applicable here)",
        },
        {
          id: "ts-d2",
          label: "450.6",
          description: "Secondary ties (paralleled transformers only)",
        },
        {
          id: "ts-d3",
          label: "240.21(B)",
          description: "Feeder tap rules (separate from transformer protection)",
        },
      ],
      explanation:
        "Start with the transformer nameplate to get kVA and voltage, then calculate secondary full-load amps. Table 450.3(B) gives the maximum OCPD percentage (125% for currents 9A or more, 167% for less than 9A). Round to the next standard size per 240.6(A), then size conductors from Table 310.16. Table 450.3(A) is for transformers over 1000V, 450.6 covers secondary ties, and 240.21(B) addresses tap rules \u2014 none apply to a basic secondary protection calculation.",
    },

    // ── Hard (3 scenarios) ─────────────────────────────────────────────

    {
      id: "commercial-kitchen-service",
      title: "Commercial Service with Kitchen Equipment",
      description:
        "Calculate a commercial service load including kitchen equipment and a sign outlet.",
      difficulty: "hard",
      steps: [
        {
          id: "ck-1",
          label: "Table 220.12",
          description: "Lighting VA/sq ft by occupancy type",
        },
        {
          id: "ck-2",
          label: "Table 220.42",
          description: "Apply lighting demand factors",
        },
        {
          id: "ck-3",
          label: "220.14(I)",
          description: "Calculate receptacle loads at 180 VA each",
        },
        {
          id: "ck-4",
          label: "Table 220.44",
          description: "Apply receptacle demand factors",
        },
        {
          id: "ck-5",
          label: "Table 220.56",
          description: "Apply kitchen equipment demand factor by count",
        },
        {
          id: "ck-6",
          label: "220.14(F) / 600.5(A)",
          description: "Add sign outlet at 1,200 VA (not a receptacle load)",
        },
        {
          id: "ck-7",
          label: "Sum & Size Service",
          description: "Total VA \u00F7 (V \u00D7 \u221A3) for service ampacity, then size conductors",
        },
      ],
      distractors: [
        {
          id: "ck-d1",
          label: "Table 220.55",
          description: "Residential range demand factor",
        },
        {
          id: "ck-d2",
          label: "220.82",
          description: "Dwelling unit optional calculation",
        },
        {
          id: "ck-d3",
          label: "220.84",
          description: "Multifamily dwelling optional calculation",
        },
        {
          id: "ck-d4",
          label: "Table 430.250",
          description: "Three-phase motor FLC lookup",
        },
      ],
      explanation:
        "A commercial service with kitchen equipment follows the standard commercial path: lighting from Table 220.12, lighting demand from Table 220.42, receptacles at 180 VA each, receptacle demand from Table 220.44, then kitchen equipment demand from Table 220.56 (which varies by count: 3 units = 90%, 6+ units = 65%, etc.). The sign outlet per 220.14(F)/600.5(A) adds 1,200 VA at 100% and is NOT included in the receptacle demand calculation. Residential range demand (Table 220.55) and dwelling optional methods do not apply to commercial buildings.",
    },

    {
      id: "residential-ac-heat",
      title: "Residential Service with A/C & Heating",
      description:
        "Calculate a dwelling service load with air conditioning and electric heat using the noncoincident rule.",
      difficulty: "hard",
      steps: [
        {
          id: "rah-1",
          label: "Table 220.12",
          description: "General lighting load at 3 VA/sq ft",
        },
        {
          id: "rah-2",
          label: "220.52",
          description: "Add small-appliance & laundry circuit loads",
        },
        {
          id: "rah-3",
          label: "Table 220.55",
          description: "Apply range demand factor",
        },
        {
          id: "rah-4",
          label: "Table 220.54",
          description: "Apply dryer demand factor",
        },
        {
          id: "rah-5",
          label: "440.22",
          description: "A/C compressor load at 125%",
        },
        {
          id: "rah-6",
          label: "220.60",
          description: "Noncoincident loads: use larger of A/C (at 125%) vs heat",
        },
        {
          id: "rah-7",
          label: "Table 310.16",
          description: "Size service-entrance conductors",
        },
      ],
      distractors: [
        {
          id: "rah-d1",
          label: "Table 220.56",
          description: "Commercial kitchen equipment demand",
        },
        {
          id: "rah-d2",
          label: "220.82",
          description: "Dwelling optional calculation (different method)",
        },
        {
          id: "rah-d3",
          label: "Table 430.250",
          description: "Three-phase motor FLC lookup",
        },
        {
          id: "rah-d4",
          label: "430.24",
          description: "Motor feeder sizing (commercial application)",
        },
      ],
      explanation:
        "This residential standard-method calculation starts with general lighting (Table 220.12, 3 VA/sq ft), adds small-appliance and laundry circuits (220.52), applies range demand (Table 220.55), and dryer demand (Table 220.54). The A/C compressor is calculated at 125% per 440.22 before being compared to heating under 220.60's noncoincident rule \u2014 only the larger value is used since A/C and heat don't run simultaneously. Finally, conductors are sized from Table 310.16. Commercial kitchen demand, the optional method, and three-phase motor tables don't apply here.",
    },

    {
      id: "voltage-drop",
      title: "Voltage Drop Calculation",
      description:
        "Verify that a branch circuit meets NEC voltage drop recommendations.",
      difficulty: "hard",
      steps: [
        {
          id: "vd-1",
          label: "Table 310.16",
          description: "Verify conductor ampacity meets the load",
        },
        {
          id: "vd-2",
          label: "Chapter 9, Table 8",
          description: "Look up conductor resistance and circular mil area",
        },
        {
          id: "vd-3",
          label: "Chapter 9, Table 9",
          description: "Find AC resistance and reactance per unit length",
        },
        {
          id: "vd-4",
          label: "VD = 2 \u00D7 K \u00D7 I \u00D7 D / CM",
          description: "Apply the voltage drop formula",
        },
        {
          id: "vd-5",
          label: "210.19(A) Info Note",
          description: "Verify \u22643% branch circuit / \u22645% total drop",
        },
        {
          id: "vd-6",
          label: "Upsize If Needed",
          description: "Select larger conductor if voltage drop exceeds limit",
        },
      ],
      distractors: [
        {
          id: "vd-d1",
          label: "Table 310.15(C)(1)",
          description: "Bundling/conduit fill derating factors",
        },
        {
          id: "vd-d2",
          label: "Table 310.15(B)(1)",
          description: "Ambient temperature correction factors",
        },
        {
          id: "vd-d3",
          label: "Chapter 9, Table 4",
          description: "Conduit internal area (for fill, not voltage drop)",
        },
        {
          id: "vd-d4",
          label: "240.6(A)",
          description: "Standard overcurrent device sizes",
        },
      ],
      explanation:
        "Voltage drop analysis begins by confirming the conductor's ampacity meets the load (Table 310.16), then gathering resistance and area data from Chapter 9 Tables 8 and 9. The formula VD = 2 \u00D7 K \u00D7 I \u00D7 D / CM is applied, and the result is checked against the 210.19(A) Informational Note recommendations (\u22643% for a branch circuit, \u22645% total including the feeder). If the drop is too high, the conductor must be upsized. Bundling derating, temperature correction, conduit fill, and OCPD sizing are separate considerations that don't factor into voltage drop itself.",
    },
  ],
};
