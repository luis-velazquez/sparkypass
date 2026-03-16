export type SniperDeck = "everyday-carry" | "code-math";

export interface SniperCard {
  id: string;
  term: string;
  reference: string;
  description: string;
  deck: SniperDeck;
}

export interface SniperPack {
  id: string;
  name: string;
  cards: SniperCard[];
}

export const SNIPER_PACKS: SniperPack[] = [
  {
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
  },
  {
    id: "pack-1",
    name: "Expansion Pack 1",
    cards: [
      {
        id: "ec-ground-rod-resistance",
        term: "Ground Rod Resistance",
        reference: "250.53(A)(2)",
        description:
          "The 25-ohm rule and the requirement for a supplemental rod.",
        deck: "everyday-carry",
      },
      {
        id: "ec-minimum-conductor-size",
        term: "Minimum Conductor Size",
        reference: "310.3",
        description:
          "The general rule that conductors shall not be smaller than 14 AWG.",
        deck: "everyday-carry",
      },
      {
        id: "ec-securing-nm-cable",
        term: "Securing NM Cable",
        reference: "334.30",
        description:
          "Securing distances (12 inches from box, every 4.5 feet) for Romex.",
        deck: "everyday-carry",
      },
      {
        id: "ec-securing-mc-cable",
        term: "Securing MC Cable",
        reference: "330.30",
        description:
          "Securing distances (12 inches from box, every 6 feet) for Metal-Clad.",
        deck: "everyday-carry",
      },
      {
        id: "ec-conduit-body-volume",
        term: "Conduit Body Volume (LBs)",
        reference: "314.16(C)",
        description: "Sizing requirements for short-radius conduit bodies.",
        deck: "everyday-carry",
      },
      {
        id: "ec-hvac-disconnect",
        term: "HVAC Disconnect",
        reference: "440.14",
        description:
          "Location and sight requirements for A/C unit disconnects.",
        deck: "everyday-carry",
      },
      {
        id: "ec-motor-disconnect-location",
        term: "Motor Disconnect Location",
        reference: "430.102(B)",
        description: '"In sight from" rules for motor disconnects.',
        deck: "everyday-carry",
      },
      {
        id: "ec-closet-luminaires",
        term: "Closet Luminaires",
        reference: "410.16",
        description: "Clearances for lighting fixtures in clothes closets.",
        deck: "everyday-carry",
      },
      {
        id: "ec-color-coding-branch-circuits",
        term: "Color Coding (Branch Circuits)",
        reference: "210.5",
        description:
          "Identification rules for ungrounded and grounded conductors.",
        deck: "everyday-carry",
      },
      {
        id: "ec-protection-from-physical-damage",
        term: "Protection from Physical Damage",
        reference: "300.4",
        description:
          "Rules for nail plates and drilling through wood/metal framing.",
        deck: "everyday-carry",
      },
    ],
  },
  {
    id: "pack-2",
    name: "Expansion Pack 2",
    cards: [
      {
        id: "ec-mwbc-disconnect",
        term: "MWBC Disconnect",
        reference: "210.4(B)",
        description:
          "Simultaneous disconnect rules for Multi-Wire Branch Circuits.",
        deck: "everyday-carry",
      },
      {
        id: "ec-receptacle-replacement",
        term: "Receptacle Replacement",
        reference: "406.4(D)",
        description:
          "Rules for replacing non-grounding type or old receptacles.",
        deck: "everyday-carry",
      },
      {
        id: "ec-island-peninsular-countertops",
        term: "Island/Peninsular Countertops",
        reference: "210.52(C)(2)",
        description:
          "Rules for receptacle placement on kitchen islands and peninsulas.",
        deck: "everyday-carry",
      },
      {
        id: "ec-working-space-illumination",
        term: "Working Space Illumination",
        reference: "110.26(D)",
        description: "Lighting requirements for electrical equipment rooms.",
        deck: "everyday-carry",
      },
      {
        id: "ec-working-space-headroom",
        term: "Working Space Headroom",
        reference: "110.26(A)(3)",
        description:
          "The 6.5-foot minimum headroom rule around service equipment.",
        deck: "everyday-carry",
      },
      {
        id: "ec-abandoned-cable-removal",
        term: "Abandoned Cable Removal",
        reference: "800.25",
        description:
          "Requirement to remove accessible abandoned communications wire.",
        deck: "everyday-carry",
      },
      {
        id: "ec-nm-cable-protection",
        term: "NM Cable Protection",
        reference: "334.15(B)",
        description:
          "Sleeving Romex in conduit where subject to physical damage.",
        deck: "everyday-carry",
      },
      {
        id: "ec-wet-location-covers",
        term: "Wet Location Covers",
        reference: "406.9(B)",
        description:
          '"In-use" or bubble cover requirements for wet locations.',
        deck: "everyday-carry",
      },
      {
        id: "ec-bathtub-luminaire-zone",
        term: "Bathtub Luminaire Zone",
        reference: "410.10(D)",
        description:
          "The 3-foot horizontal and 8-foot vertical clearance zone for fixtures.",
        deck: "everyday-carry",
      },
      {
        id: "ec-recessed-lighting-ic",
        term: "Recessed Lighting (IC)",
        reference: "410.116",
        description:
          "Clearances for Insulation Contact (IC) vs. Non-IC rated fixtures.",
        deck: "everyday-carry",
      },
    ],
  },
  {
    id: "pack-3",
    name: "Expansion Pack 3",
    cards: [
      {
        id: "ec-ceiling-fan-box-support",
        term: "Ceiling Fan Box Support",
        reference: "314.27(C)",
        description:
          "Outlet box listing and weight limits for paddle fans.",
        deck: "everyday-carry",
      },
      {
        id: "ec-splices-in-cabinets",
        term: "Splices in Cabinets",
        reference: "312.8(A)",
        description:
          "Rules for wire-nutting or passing through wires inside a panelboard.",
        deck: "everyday-carry",
      },
      {
        id: "ec-neutral-identification",
        term: "Neutral Identification",
        reference: "200.6",
        description:
          "Sizing and color rules for the grounded (neutral) conductor.",
        deck: "everyday-carry",
      },
      {
        id: "ec-ground-wire-identification",
        term: "Ground Wire Identification",
        reference: "250.119",
        description:
          "Sizing and color rules for the equipment grounding conductor.",
        deck: "everyday-carry",
      },
      {
        id: "ec-high-leg-identification",
        term: "High-Leg Identification",
        reference: "110.15",
        description:
          'The "orange wire" rule for 4-wire delta-connected systems.',
        deck: "everyday-carry",
      },
      {
        id: "ec-circuit-directory",
        term: "Circuit Directory",
        reference: "408.4(A)",
        description:
          "Requirement for accurate, legible panelboard labeling.",
        deck: "everyday-carry",
      },
      {
        id: "ec-closing-unused-openings",
        term: "Closing Unused Openings",
        reference: "110.12(A)",
        description:
          "Rules for plugging missing knockouts (KOs) in boxes and panels.",
        deck: "everyday-carry",
      },
      {
        id: "ec-plenum-wiring",
        term: "Plenum Wiring",
        reference: "300.22(C)",
        description:
          "Approved wiring methods for environmental air-handling spaces.",
        deck: "everyday-carry",
      },
      {
        id: "ec-appliance-disconnects",
        term: "Appliance Disconnects",
        reference: "422.31",
        description:
          "Location and lock-out requirements for hardwired appliances.",
        deck: "everyday-carry",
      },
      {
        id: "ec-sign-disconnects",
        term: "Sign Disconnects",
        reference: "600.6",
        description:
          "Disconnecting means requirements for outline lighting and signs.",
        deck: "everyday-carry",
      },
    ],
  },
  {
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
  },
  {
    id: "pack-5",
    name: "Expansion Pack 5",
    cards: [
      {
        id: "ec-luminaires-used-as-raceways",
        term: "Luminaires Used as Raceways",
        reference: "410.64",
        description:
          "Restrictions on passing through conductors in lighting fixtures.",
        deck: "everyday-carry",
      },
      {
        id: "ec-panelboard-overcurrent-protection",
        term: "Panelboard Overcurrent Protection",
        reference: "408.36",
        description:
          "Main breaker or main lug sizing and protection rules for panels.",
        deck: "everyday-carry",
      },
      {
        id: "ec-show-window-branch-circuits",
        term: "Show Window Branch Circuits",
        reference: "210.62",
        description: "Requirement for receptacles above show windows.",
        deck: "everyday-carry",
      },
      {
        id: "ec-meeting-room-receptacles",
        term: "Meeting Room Receptacles",
        reference: "210.71",
        description:
          "Requirements for floor and wall receptacles in commercial meeting spaces.",
        deck: "everyday-carry",
      },
      {
        id: "ec-bushings-for-4-awg-and-larger",
        term: "Bushings for #4 AWG and Larger",
        reference: "300.4(G)",
        description:
          "Insulated fitting requirements where large conductors enter a cabinet.",
        deck: "everyday-carry",
      },
      {
        id: "ec-splicing-in-underground-trenches",
        term: "Splicing in Underground Trenches",
        reference: "300.5(E)",
        description:
          "Approved methods for splices made directly in the earth.",
        deck: "everyday-carry",
      },
      {
        id: "ec-grounding-of-metal-enclosures",
        term: "Grounding of Metal Enclosures",
        reference: "250.86",
        description:
          "General requirement to ground metal enclosures and raceways.",
        deck: "everyday-carry",
      },
      {
        id: "ec-disconnecting-means-for-transformers",
        term: "Disconnecting Means for Transformers",
        reference: "450.14",
        description:
          "Location and lock-out rules for transformer disconnects.",
        deck: "everyday-carry",
      },
      {
        id: "ec-fire-alarm-circuit-wiring",
        term: "Fire Alarm Circuit Wiring",
        reference: "760.46",
        description: "Wiring methods permitted for non-power-limited fire alarm circuits.",
        deck: "everyday-carry",
      },
      {
        id: "ec-multioutlet-assemblies",
        term: "Multioutlet Assemblies",
        reference: "Article 380",
        description: "Rules for surface-mounted multioutlet systems.",
        deck: "everyday-carry",
      },
    ],
  },
  {
    id: "pack-6",
    name: "Expansion Pack 6",
    cards: [
      {
        id: "ec-hallway-receptacles",
        term: "Hallway Receptacles",
        reference: "210.52(H)",
        description:
          "The 10-foot rule for required hallway receptacles.",
        deck: "everyday-carry",
      },
      {
        id: "ec-foyer-receptacles",
        term: "Foyer Receptacles",
        reference: "210.52(I)",
        description:
          "Wall space requirements for foyers larger than 60 sq ft.",
        deck: "everyday-carry",
      },
      {
        id: "ec-hvac-service-receptacle",
        term: "HVAC Service Receptacle",
        reference: "210.63",
        description:
          "The required 125V receptacle within 25 feet of heating/AC equipment.",
        deck: "everyday-carry",
      },
      {
        id: "ec-stairway-lighting-switches",
        term: "Stairway Lighting Switches",
        reference: "210.70(A)(2)(c)",
        description:
          "Rule requiring switches at each level for interior stairs with 6+ steps.",
        deck: "everyday-carry",
      },
      {
        id: "ec-open-conductor-roof-clearance",
        term: "Open Conductor Roof Clearance",
        reference: "225.19(A)",
        description:
          "The vertical clearances required above roofs for outside circuits.",
        deck: "everyday-carry",
      },
      {
        id: "ec-garage-receptacle-placement",
        term: "Garage Receptacle Placement",
        reference: "210.52(G)(1)",
        description:
          "Rule requiring at least one receptacle per vehicle space.",
        deck: "everyday-carry",
      },
      {
        id: "ec-max-breaker-handle-height",
        term: "Max Breaker Handle Height",
        reference: "240.24(A)",
        description:
          "The 6 ft 7 inch (2.0m) maximum height rule for switches and breakers.",
        deck: "everyday-carry",
      },
      {
        id: "ec-breakers-in-closets",
        term: "Breakers in Closets",
        reference: "240.24(D)",
        description:
          "The strict prohibition of overcurrent devices in clothes closets.",
        deck: "everyday-carry",
      },
      {
        id: "ec-breakers-in-bathrooms",
        term: "Breakers in Bathrooms",
        reference: "240.24(E)",
        description:
          "The prohibition of branch-circuit breakers in dwelling bathrooms.",
        deck: "everyday-carry",
      },
      {
        id: "ec-nm-cable-bend-radius",
        term: "NM Cable Bend Radius",
        reference: "334.24",
        description:
          "The 5-times the cable diameter rule for bending Romex.",
        deck: "everyday-carry",
      },
    ],
  },
  {
    id: "pack-7",
    name: "Expansion Pack 7",
    cards: [
      {
        id: "ec-emt-max-degrees-of-bend",
        term: "EMT Max Degrees of Bend",
        reference: "358.26",
        description:
          "The absolute limit of 360 degrees of bend between pull points.",
        deck: "everyday-carry",
      },
      {
        id: "ec-pvc-expansion-fittings",
        term: "PVC Expansion Fittings",
        reference: "352.44",
        description:
          "Requirements for thermal expansion and contraction compensation.",
        deck: "everyday-carry",
      },
      {
        id: "ec-floor-receptacle-placement",
        term: "Floor Receptacle Placement",
        reference: "210.52(A)(3)",
        description:
          "Must be within 18 inches of the wall to count as required wall space.",
        deck: "everyday-carry",
      },
      {
        id: "ec-countertop-receptacle-height",
        term: "Countertop Receptacle Height",
        reference: "210.52(C)(3)",
        description:
          "Receptacles cannot be located more than 20 inches above the countertop.",
        deck: "everyday-carry",
      },
      {
        id: "ec-dishwasher-cord-length",
        term: "Dishwasher Cord Length",
        reference: "422.16(B)(2)",
        description:
          "Permitted cord lengths ranging from 3 feet to 6.5 feet.",
        deck: "everyday-carry",
      },
      {
        id: "ec-disposal-cord-length",
        term: "Disposal Cord Length",
        reference: "422.16(B)(1)",
        description:
          "Permitted cord lengths ranging from 18 inches to 36 inches.",
        deck: "everyday-carry",
      },
      {
        id: "ec-crawl-space-lighting",
        term: "Crawl Space Lighting",
        reference: "210.70(C)",
        description:
          "Required lighting in crawl spaces containing equipment requiring service.",
        deck: "everyday-carry",
      },
      {
        id: "ec-bathtub-receptacle-prohibition",
        term: "Bathtub Receptacle Prohibition",
        reference: "406.9(C)",
        description:
          "Receptacles are completely prohibited inside bathtub or shower spaces.",
        deck: "everyday-carry",
      },
      {
        id: "ec-illumination-at-exterior-doors",
        term: "Illumination at Exterior Doors",
        reference: "210.70(A)(2)(b)",
        description:
          "Required switched lighting at grade-level outdoor entrances.",
        deck: "everyday-carry",
      },
      {
        id: "ec-ig-receptacle-marking",
        term: "IG Receptacle Marking",
        reference: "406.3(D)",
        description:
          'The "Orange Triangle" marking rule for Isolated Ground receptacles.',
        deck: "everyday-carry",
      },
    ],
  },
  {
    id: "pack-8",
    name: "Expansion Pack 8",
    cards: [
      {
        id: "ec-outdoor-outlet-mounting",
        term: "Outdoor Outlet Mounting",
        reference: "406.9(B)(1)",
        description:
          "Enclosures in wet locations shall be weatherproof whether or not the attachment plug cap is inserted.",
        deck: "everyday-carry",
      },
      {
        id: "ec-basement-receptacle-rule",
        term: "Basement Receptacle Rule",
        reference: "210.52(G)(3)",
        description:
          "Requirement for at least one receptacle in each separate unfinished portion of a basement.",
        deck: "everyday-carry",
      },
      {
        id: "ec-laundry-area-receptacle",
        term: "Laundry Area Receptacle",
        reference: "210.52(F)",
        description:
          "The requirement for at least one receptacle installed for the laundry area.",
        deck: "everyday-carry",
      },
      {
        id: "ec-mechanical-equipment-lighting",
        term: "Mechanical Equipment Lighting",
        reference: "210.70(C)",
        description:
          "Required switched lighting for equipment in attics or underfloor spaces.",
        deck: "everyday-carry",
      },
      {
        id: "ec-rmc-max-bends",
        term: "RMC Max Degrees of Bend",
        reference: "344.26",
        description: "The absolute limit of 360 degrees of bend between pull points for rigid metal conduit.",
        deck: "everyday-carry",
      },
      {
        id: "ec-bending-radius-of-rmc",
        term: "Bending Radius of RMC",
        reference: "344.24",
        description:
          "Requirements for bending Rigid Metal Conduit to prevent damage.",
        deck: "everyday-carry",
      },
      {
        id: "ec-expansion-of-pvc",
        term: "Expansion of PVC",
        reference: "352.44",
        description:
          'The rule for using expansion fittings when length change is expected to be 1/4" or greater.',
        deck: "everyday-carry",
      },
      {
        id: "ec-protection-of-fmc",
        term: "Protection of FMC",
        reference: "348.12(1)",
        description:
          "Prohibited locations for Flexible Metal Conduit where subject to physical damage.",
        deck: "everyday-carry",
      },
      {
        id: "ec-support-of-lfmc",
        term: "Support of LFMC",
        reference: "350.30(A)",
        description:
          'Securing requirements for Liquidtight Flexible Metal Conduit (12" from box, 4.5\' apart).',
        deck: "everyday-carry",
      },
      {
        id: "ec-surface-mounted-luminaires",
        term: "Surface Mounted Luminaires",
        reference: "410.11",
        description:
          "Rules for installing fixtures on combustible surfaces.",
        deck: "everyday-carry",
      },
    ],
  },
  {
    id: "pack-9",
    name: "Expansion Pack 9",
    cards: [
      {
        id: "ec-underground-wet-locations",
        term: "Underground Wet Locations",
        reference: "300.5(B)",
        description:
          "The rule that the interior of underground raceways is considered a wet location.",
        deck: "everyday-carry",
      },
      {
        id: "ec-voltage-warning-signs",
        term: "Voltage Warning Signs",
        reference: "110.21(B)",
        description:
          "Requirements for field-applied hazard markings and signs.",
        deck: "everyday-carry",
      },
      {
        id: "ec-flash-protection-marking",
        term: "Flash Protection Marking",
        reference: "110.16(A)",
        description:
          "Required arc-flash warning labels on switchboards and panelboards.",
        deck: "everyday-carry",
      },
      {
        id: "ec-integrity-of-electrical-equipment",
        term: "Integrity of Electrical Equipment",
        reference: "110.12(B)",
        description:
          "Rules regarding internal parts being free of contamination (dust/debris).",
        deck: "everyday-carry",
      },
      {
        id: "ec-mounting-of-equipment",
        term: "Mounting of Equipment",
        reference: "110.13(A)",
        description:
          "General rule that electrical equipment must be firmly secured to the surface.",
        deck: "everyday-carry",
      },
      {
        id: "ec-separation-from-piping",
        term: "Separation from Piping",
        reference: "300.8",
        description:
          "General prohibition of conductors/raceways in the same duct/shaft as non-electrical piping.",
        deck: "everyday-carry",
      },
      {
        id: "ec-nm-cable-in-shallow-chases",
        term: "NM Cable in Shallow Chases",
        reference: "300.4(F)",
        description:
          'Protection requirements (steel plates) when NM cable is in a chase under 1.25".',
        deck: "everyday-carry",
      },
      {
        id: "ec-box-volume-allowance-clamps",
        term: "Box Volume Allowance (Clamps)",
        reference: "314.16(B)(2)",
        description:
          "Rule that one or more internal cable clamps count as a single volume allowance.",
        deck: "everyday-carry",
      },
      {
        id: "ec-box-volume-allowance-support",
        term: "Box Volume Allowance (Support)",
        reference: "314.16(B)(3)",
        description:
          "Rules for how luminaire studs or hickeys count toward box fill.",
        deck: "everyday-carry",
      },
      {
        id: "ec-box-volume-allowance-devices",
        term: "Box Volume Allowance (Devices)",
        reference: "314.16(B)(4)",
        description:
          "The double-volume allowance rule for each yoke or strap containing devices.",
        deck: "everyday-carry",
      },
    ],
  },
  {
    id: "pack-10",
    name: "Expansion Pack 10",
    cards: [
      // ─── Deck 2: Code Math (123 cards) ────────────────────────────────
      {
        id: "cm-conduit-fill",
        term: "Conduit Fill %",
        reference: "Chapter 9, Table 4",
        description: "Finding the usable area inside raceways.",
        deck: "code-math",
      },
      {
        id: "cm-ac-vs-heat-comparison",
        term: "A/C vs Heat Comparison",
        reference: "220.60",
        description: "Using the larger of A/C or heating load, not both, when they are noncoincident.",
        deck: "code-math",
      },
      {
        id: "cm-largest-motor-25-percent",
        term: "Largest Motor 25%",
        reference: "430.24",
        description: "Adding 25% of the largest motor FLC to the sum of all other motor loads for feeder sizing.",
        deck: "code-math",
      },
      {
        id: "cm-motor-branch-circuit-conductor",
        term: "Motor Branch Circuit Conductor",
        reference: "430.22(A)",
        description: "Sizing the branch circuit conductor at 125% of a single motor's full-load current.",
        deck: "code-math",
      },
      {
        id: "cm-service-entrance-conductor-sizing",
        term: "Service Entrance Conductor Sizing",
        reference: "230.42(A)(1)",
        description: "Service conductors must have sufficient ampacity for the calculated load.",
        deck: "code-math",
      },
      {
        id: "cm-general-lighting-va-per-sqft",
        term: "General Lighting VA/sq ft",
        reference: "220.12",
        description: "Applying the unit VA per square foot for different occupancy types to calculate lighting load.",
        deck: "code-math",
      },
      {
        id: "cm-motor-overload-protection",
        term: "Motor Overload Protection",
        reference: "430.32",
        description:
          "Sizing the separate overload device (heaters) for continuous duty.",
        deck: "code-math",
      },
      {
        id: "cm-motor-feeder-sizing",
        term: "Motor Feeder Sizing",
        reference: "430.24",
        description:
          'The "125% of largest motor + sum of the rest" rule.',
        deck: "code-math",
      },
      {
        id: "cm-demand-factor-ranges-column-c",
        term: "Demand Factor Ranges (Column C)",
        reference: "220.55",
        description: "Using Column C demand factors for household ranges rated over 12 kW.",
        deck: "code-math",
      },
      {
        id: "cm-standard-calculation-dwelling",
        term: "Standard Calculation (Dwelling)",
        reference: "Article 220, Part III",
        description: "The standard step-by-step method for computing dwelling unit service loads.",
        deck: "code-math",
      },
    ],
  },
  {
    id: "pack-11",
    name: "Expansion Pack 11",
    cards: [
      {
        id: "cm-small-appliance-load",
        term: "Small Appliance Load",
        reference: "220.52(A)",
        description: "Two or more 20A small-appliance branch circuits at 1500 VA each.",
        deck: "code-math",
      },
      {
        id: "cm-laundry-load-calculation",
        term: "Laundry Load Calculation",
        reference: "220.52(B)",
        description: "At least one 20A, 1500 VA laundry branch circuit required for dwelling.",
        deck: "code-math",
      },
      {
        id: "cm-track-lighting-load",
        term: "Track Lighting Load",
        reference: "220.43(B)",
        description:
          "Calculating the VA load for lighting track per linear foot.",
        deck: "code-math",
      },
      {
        id: "cm-continuous-load",
        term: "Continuous Load",
        reference: "210.20(A)",
        description:
          "The 125% multiplier rule for loads running 3+ hours.",
        deck: "code-math",
      },
      {
        id: "cm-optional-calc-dwelling",
        term: "Optional Calc Dwelling",
        reference: "220.82",
        description:
          "The simplified load calculation method for a single-family home.",
        deck: "code-math",
      },
      {
        id: "cm-multifamily-optional-calc",
        term: "Multifamily Optional Calc",
        reference: "220.84",
        description:
          "The simplified demand factors for multifamily dwelling units.",
        deck: "code-math",
      },
      {
        id: "cm-first-10kva-at-100-percent",
        term: "First 10 kVA at 100%",
        reference: "220.42",
        description: "Applying demand factors — first 10,000 VA at 100%, remainder at reduced percentages.",
        deck: "code-math",
      },
      {
        id: "cm-dwelling-dryer-load",
        term: "Dwelling Dryer Load",
        reference: "220.54",
        description: "5000 VA or nameplate rating (whichever larger) for each dryer in a dwelling.",
        deck: "code-math",
      },
      {
        id: "cm-pull-box-straight-pull",
        term: "Pull Box (Straight Pull)",
        reference: "314.28(A)(1)",
        description:
          'The "8 times the largest raceway" rule for sizing boxes.',
        deck: "code-math",
      },
      {
        id: "cm-pull-box-angle-pull",
        term: "Pull Box (Angle Pull)",
        reference: "314.28(A)(2)",
        description:
          'The "6 times the largest raceway" rule for sizing boxes.',
        deck: "code-math",
      },
    ],
  },
  {
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
  },
  {
    id: "pack-13",
    name: "Expansion Pack 13",
    cards: [
      {
        id: "cm-sign-outline-lighting-load",
        term: "Sign/Outline Lighting Load",
        reference: "220.14(F)",
        description:
          "The 1200 VA minimum load requirement for sign branch circuits.",
        deck: "code-math",
      },
      {
        id: "cm-multioutlet-assembly-load",
        term: "Multioutlet Assembly Load",
        reference: "220.14(H)",
        description:
          "Calculating load based on 1.5 ft vs 5 ft intervals.",
        deck: "code-math",
      },
      {
        id: "cm-heavy-duty-lampholder-load",
        term: "Heavy-Duty Lampholder Load",
        reference: "220.14(E)",
        description:
          "The 600 VA minimum load per heavy-duty fixture.",
        deck: "code-math",
      },
      {
        id: "cm-electric-range-demand",
        term: "Electric Range Demand",
        reference: "220.55",
        description: "Using demand factors (Column A/B/C) for household ranges based on number and kW rating.",
        deck: "code-math",
      },
      {
        id: "cm-cooking-equipment-note-4",
        term: "Cooking Equipment Note 4",
        reference: "220.55 Note 4",
        description: "Increasing Column C value by 5% for each kW that exceeds 12 kW.",
        deck: "code-math",
      },
      {
        id: "cm-mobile-home-load",
        term: "Mobile Home Load",
        reference: "550.18",
        description:
          "Load calculation methodology for mobile and manufactured homes.",
        deck: "code-math",
      },
      {
        id: "cm-flexible-cord-overcurrent",
        term: "Flexible Cord Overcurrent",
        reference: "240.5",
        description: "The overcurrent protection limits based on flexible cord ampacity ratings.",
        deck: "code-math",
      },
      {
        id: "cm-fixture-wire-overcurrent",
        term: "Fixture Wire Overcurrent",
        reference: "240.5(B)(2)",
        description: "The overcurrent protection limits for 18 AWG and 16 AWG fixture wires.",
        deck: "code-math",
      },
      {
        id: "cm-welders-ampacity-duty-cycle",
        term: "Welders Ampacity/Duty Cycle",
        reference: "630.11(A)",
        description:
          "Multipliers for arc welder supply conductors based on duty cycle.",
        deck: "code-math",
      },
      {
        id: "cm-ac-motor-compressor-circuit",
        term: "A/C Motor-Compressor Circuit",
        reference: "440.22",
        description:
          "Sizing short-circuit protection (175% or 225% rule) for hermetic motors.",
        deck: "code-math",
      },
    ],
  },
  {
    id: "pack-14",
    name: "Expansion Pack 14",
    cards: [
      {
        id: "cm-elevator-motor-disconnect",
        term: "Elevator Motor Disconnect",
        reference: "620.51(A)",
        description: "Requirements for the elevator machine room disconnecting means.",
        deck: "code-math",
      },
      {
        id: "cm-fire-pump-voltage-drop",
        term: "Fire Pump Voltage Drop",
        reference: "695.7",
        description:
          "The strict 15% starting and 5% running voltage drop limits for fire pumps.",
        deck: "code-math",
      },
      {
        id: "cm-conductor-properties-area-ohms",
        term: "Conductor Properties (Area/Ohms)",
        reference: "Chapter 9, Table 8",
        description:
          "D.C. resistance and cross-sectional area for solid/stranded wires.",
        deck: "code-math",
      },
      {
        id: "cm-ac-resistance-and-reactance",
        term: "AC Resistance & Reactance",
        reference: "Chapter 9, Table 9",
        description:
          "Multiplying factors for finding AC resistance and voltage drop.",
        deck: "code-math",
      },
      {
        id: "cm-annex-c-tubing-fill",
        term: "Annex C (Tubing Fill)",
        reference: "Annex C, Tables",
        description:
          "Finding the maximum number of same-size conductors in specific raceways.",
        deck: "code-math",
      },
      {
        id: "cm-neutral-derating-harmonics",
        term: "Neutral Derating (Harmonics)",
        reference: "310.15(E)(3)",
        description:
          "Counting the neutral as a current-carrying conductor for non-linear loads.",
        deck: "code-math",
      },
      {
        id: "cm-parallel-egc-sizing",
        term: "Parallel EGC Sizing",
        reference: "250.122(F)",
        description:
          "Rules for sizing equipment grounding conductors in parallel raceways.",
        deck: "code-math",
      },
      {
        id: "cm-working-space-conditions",
        term: "Working Space Conditions",
        reference: "110.26(A)(1)",
        description: "Three conditions for determining the depth of clear working space based on voltage.",
        deck: "code-math",
      },
      {
        id: "cm-single-phase-dwelling-services",
        term: "Single-Phase Dwelling Services",
        reference: "310.12",
        description:
          "The 83% rule for sizing single-phase dwelling unit services and feeders.",
        deck: "code-math",
      },
      {
        id: "cm-small-conductor-rule",
        term: "Small Conductor Rule",
        reference: "240.4(D)",
        description:
          "The strict breaker limits for 14 AWG (15A), 12 AWG (20A), and 10 AWG (30A).",
        deck: "code-math",
      },
    ],
  },
  {
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
  },
  {
    id: "pack-16",
    name: "Expansion Pack 16",
    cards: [
      {
        id: "cm-marina-feeder-calculation",
        term: "Marina Feeder Calculation",
        reference: "555.53",
        description: "Applying demand factors to marina/boatyard feeders based on total number of receptacles.",
        deck: "code-math",
      },
      {
        id: "cm-rv-park-site-ratios",
        term: "RV Park Site Ratios",
        reference: "551.71",
        description:
          "Requirement for 20% of sites to have 50A and 70% to have 30A receptacles.",
        deck: "code-math",
      },
      {
        id: "cm-neutral-sizing-dwelling-ranges",
        term: "Neutral Sizing (Dwelling Ranges)",
        reference: "220.61(B)(1)",
        description:
          "The feeder neutral can be sized at 70% of the calculated range load.",
        deck: "code-math",
      },
      {
        id: "cm-minimum-branch-circuit-for-ranges",
        term: "Minimum Branch Circuit for Ranges",
        reference: "210.19(A)(3)",
        description:
          "Ranges rated 8 3/4 kW or more require a minimum 40-amp branch circuit.",
        deck: "code-math",
      },
      {
        id: "cm-appliance-branch-circuit-size",
        term: "Appliance Branch Circuit Size",
        reference: "422.10(A)",
        description:
          "Sizing individual branch circuits for non-motor-operated appliances.",
        deck: "code-math",
      },
      {
        id: "cm-workspace-width",
        term: "Workspace Width",
        reference: "110.26(A)(2)",
        description:
          "Minimum width of 30 inches or the width of the equipment, whichever is greater.",
        deck: "code-math",
      },
      {
        id: "cm-ground-ring-size",
        term: "Ground Ring Size",
        reference: "250.52(A)(4)",
        description:
          "Minimum requirement of 2 AWG bare copper for a ground ring.",
        deck: "code-math",
      },
      {
        id: "cm-concrete-encased-electrode-size",
        term: "Concrete-Encased Electrode Size",
        reference: "250.52(A)(3)",
        description:
          "Minimum requirement of 4 AWG copper for a Ufer ground.",
        deck: "code-math",
      },
      {
        id: "cm-ground-rod-minimum-size",
        term: "Ground Rod Minimum Size",
        reference: "250.52(A)(5)",
        description:
          "Minimum physical dimensions of 5/8 inch diameter and 8 feet in length.",
        deck: "code-math",
      },
      {
        id: "cm-dwelling-lighting-load",
        term: "Dwelling Lighting Load",
        reference: "220.14(J)",
        description:
          "The 3 VA per square foot calculation for general dwelling unit lighting.",
        deck: "code-math",
      },
    ],
  },
  {
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
  },
  {
    id: "pack-18",
    name: "Expansion Pack 18",
    cards: [
      {
        id: "cm-school-load-optional",
        term: "School Load (Optional Method)",
        reference: "220.86",
        description: "Using the optional calculation method for schools based on total connected load.",
        deck: "code-math",
      },
      {
        id: "cm-restaurant-load-optional",
        term: "Restaurant Load (Optional Method)",
        reference: "220.88",
        description: "Using the optional calculation method for restaurants based on total connected load.",
        deck: "code-math",
      },
      {
        id: "cm-mobile-home-park-feeder",
        term: "Mobile Home Park Feeder",
        reference: "550.31",
        description: "Sizing the service and feeder for a mobile home park based on the number of lots.",
        deck: "code-math",
      },
      {
        id: "cm-cable-tray-fill-multiconductor",
        term: "Cable Tray Fill (Multiconductor)",
        reference: "392.22(A)",
        description:
          "Calculating maximum allowable fill area for cables 4/0 AWG and larger.",
        deck: "code-math",
      },
      {
        id: "cm-cable-tray-ampacity-derating",
        term: "Cable Tray Ampacity Derating",
        reference: "392.80(A)",
        description:
          "Adjusting conductor ampacities when cables are installed in a tray.",
        deck: "code-math",
      },
      {
        id: "cm-metal-wireway-fill-20-rule",
        term: "Metal Wireway Fill (20% Rule)",
        reference: "376.22(A)",
        description:
          "Sum of cross-sectional areas of conductors cannot exceed 20% of the wireway.",
        deck: "code-math",
      },
      {
        id: "cm-metal-wireway-ampacity-derating",
        term: "Metal Wireway Ampacity Derating",
        reference: "376.22(B)",
        description:
          "Derating is required when more than 30 current-carrying conductors are present.",
        deck: "code-math",
      },
      {
        id: "cm-metal-wireway-splice-fill-75",
        term: "Metal Wireway Splice Fill (75%)",
        reference: "376.56(A)",
        description:
          "Conductors and splices combined cannot exceed 75% of the wireway area.",
        deck: "code-math",
      },
      {
        id: "cm-nonmetallic-wireway-fill",
        term: "Nonmetallic Wireway Fill",
        reference: "378.22",
        description:
          "Using the same 20% fill rules for nonmetallic troughs and wireways.",
        deck: "code-math",
      },
      {
        id: "cm-auxiliary-gutter-conductor-fill",
        term: "Auxiliary Gutter Conductor Fill",
        reference: "366.22(A)",
        description:
          "The 20% conductor limit rule for sheet metal auxiliary gutters.",
        deck: "code-math",
      },
    ],
  },
  {
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
  },
  {
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
  },
  {
    id: "pack-21",
    name: "Expansion Pack 21",
    cards: [
      {
        id: "cm-neutral-sizing-services",
        term: "Neutral Sizing (Services)",
        reference: "250.24(D)",
        description:
          "Minimum routing and sizing of the grounded conductor to the service equipment.",
        deck: "code-math",
      },
      {
        id: "cm-hospital-lighting-demand",
        term: "Hospital Lighting Demand",
        reference: "220.42",
        description: "The 50,000 VA threshold where hospital lighting loads get reduced demand percentages.",
        deck: "code-math",
      },
      {
        id: "cm-show-window-receptacles",
        term: "Show Window Receptacles",
        reference: "210.62",
        description:
          "The requirement of at least 1 receptacle per 12 linear feet of show window space.",
        deck: "code-math",
      },
      {
        id: "cm-sign-branch-circuit-sizing",
        term: "Sign Branch Circuit Sizing",
        reference: "600.5(B)",
        description:
          "The 20-amp minimum and the 125% continuous load requirement for sign circuits.",
        deck: "code-math",
      },
      {
        id: "cm-welder-supply-conductors-motor-generator",
        term: "Welder Supply Conductors (Motor-Generator)",
        reference: "630.11(A)",
        description:
          "Sizing the primary conductors based on the nameplate rating and duty cycle.",
        deck: "code-math",
      },
      {
        id: "cm-transformer-secondary-tie",
        term: "Transformer Secondary Tie",
        reference: "450.6",
        description:
          "Ampacity sizing rules for circuits connecting two or more transformer secondaries.",
        deck: "code-math",
      },
      {
        id: "cm-receptacle-load-non-dwelling",
        term: "Receptacle Load (Non-Dwelling)",
        reference: "220.14(I)",
        description:
          "Calculating 180 VA for each single or multiple receptacle on a single yoke/strap.",
        deck: "code-math",
      },
      {
        id: "cm-multioutlet-assembly-heavy-use",
        term: "Multioutlet Assembly (Heavy Use)",
        reference: "220.14(H)",
        description:
          "Calculating load at 180 VA for every 1.5 feet where appliances are likely to be used simultaneously.",
        deck: "code-math",
      },
      {
        id: "cm-multioutlet-assembly-light-use",
        term: "Multioutlet Assembly (Light Use)",
        reference: "220.14(H)",
        description:
          "Calculating load at 180 VA for every 5 feet where appliances will not be used simultaneously.",
        deck: "code-math",
      },
      {
        id: "cm-mobile-home-service",
        term: "Mobile Home Service",
        reference: "550.32(C)",
        description:
          "The minimum 100-ampere rating requirement for mobile home service equipment.",
        deck: "code-math",
      },
    ],
  },
  {
    id: "pack-22",
    name: "Expansion Pack 22",
    cards: [
      {
        id: "cm-rv-site-service",
        term: "RV Site Service",
        reference: "551.71",
        description:
          "Calculating the required distribution of 50A, 30A, and 20A receptacles in an RV park.",
        deck: "code-math",
      },
      {
        id: "cm-marina-shore-power",
        term: "Marina Shore Power",
        reference: "555.53",
        description:
          "Applying demand factors to size feeders based on the number of slips/receptacles.",
        deck: "code-math",
      },
      {
        id: "cm-solar-pv-system-sizing",
        term: "Solar PV System Sizing",
        reference: "690.8(B)",
        description:
          "Applying the standard 125% multiplier for continuous load to PV circuit currents.",
        deck: "code-math",
      },
    ],
  },
  {
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
  },
];

export const SNIPER_CARDS: SniperCard[] = SNIPER_PACKS.flatMap((p) => p.cards);

/** Fisher-Yates shuffle — returns a new array */
export function shuffleCards(cards: SniperCard[]): SniperCard[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Extract the article family from a reference string.
 * e.g. "314.16(A)" → "314", "Table 310.16" → "310", "250.52(A)(3)" → "250"
 */
function getArticleFamily(ref: string): string {
  const match = ref.match(/(\d{3})/);
  return match ? match[1] : ref;
}

/**
 * Returns `count` unique random reference strings from the pool,
 * excluding `correctRef`. Results are shuffled.
 */
export function getDistractors(
  correctRef: string,
  allCards: SniperCard[],
  count: number,
  smartFilter: boolean = false,
): string[] {
  const correctFamily = getArticleFamily(correctRef);

  let pool = allCards
    .map((c) => c.reference)
    .filter((ref) => ref !== correctRef);

  // Smart filter: exclude same article family (e.g. no 314.xx distractors when answer is 314.16)
  if (smartFilter) {
    const filtered = pool.filter((ref) => getArticleFamily(ref) !== correctFamily);
    // Only use filtered pool if we have enough distractors
    if (filtered.length >= count) {
      pool = filtered;
    }
  }

  // Deduplicate references
  pool = [...new Set(pool)];

  // Fisher-Yates partial shuffle to pick `count` items
  const arr = [...pool];
  const result: string[] = [];
  for (let i = 0; i < count && arr.length > 0; i++) {
    const j = Math.floor(Math.random() * arr.length);
    result.push(arr[j]);
    arr[j] = arr[arr.length - 1];
    arr.pop();
  }

  // Shuffle the result before returning
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/** Get all unique pack IDs in order */
export function getPackIds(): string[] {
  return SNIPER_PACKS.map((p) => p.id);
}

/** Get cards from unlocked packs only */
export function getUnlockedCards(unlockedPacks: string[]): SniperCard[] {
  const set = new Set(unlockedPacks);
  return SNIPER_PACKS.filter((p) => set.has(p.id)).flatMap((p) => p.cards);
}

/** Returns energize level 0-4 based on streak */
export function getEnergizeLevel(streak: number): number {
  if (streak >= 20) return 4;
  if (streak >= 15) return 3;
  if (streak >= 10) return 2;
  if (streak >= 5) return 1;
  return 0;
}

export const CORRECT_REACTIONS = [
  "Dead center!",
  "Bullseye — perfect shot!",
  "Target neutralized!",
  "Scope locked, nailed it!",
  "Clean hit — no ricochet!",
  "Right between the eyes!",
  "One shot, one code section!",
  "Sparky confirms the kill!",
];

export const TRIP_MESSAGES = [
  "Missed! Re-zero your scope.",
  "Off target — check your reference!",
  "That shot went wide. Try again!",
  "Misfire! Here's the correct section.",
  "No hit — Sparky's got the coordinates.",
];
