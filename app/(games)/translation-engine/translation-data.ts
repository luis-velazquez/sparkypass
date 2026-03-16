export interface TranslationCard {
  id: string;
  slang: string;
  officialTerm: string;
  reference: string;
  description: string;
}

export interface TranslationPack {
  id: string;
  name: string;
  cards: TranslationCard[];
}

export const TRANSLATION_PACKS: TranslationPack[] = [
  {
    id: "free",
    name: "Starter Pack",
    cards: [
      {
        id: "te-romex",
        slang: "Romex",
        officialTerm: "Nonmetallic-Sheathed Cable (NM)",
        reference: "Article 334",
        description:
          'Translating brand name to "Nonmetallic-Sheathed Cable" (NM).',
      },
      {
        id: "te-ufer-ground",
        slang: "Ufer Ground",
        officialTerm: "Concrete-Encased Electrode",
        reference: "250.52(A)(3)",
        description: 'Translating slang to "Concrete-Encased Electrode".',
      },
      {
        id: "te-smurf-tube",
        slang: "Smurf Tube",
        officialTerm: "Electrical Nonmetallic Tubing (ENT)",
        reference: "Article 362",
        description:
          'Translating slang to "Electrical Nonmetallic Tubing" (ENT).',
      },
      {
        id: "te-greenfield",
        slang: "Greenfield",
        officialTerm: "Flexible Metal Conduit (FMC)",
        reference: "Article 348",
        description: 'Translating slang to "Flexible Metal Conduit" (FMC).',
      },
      {
        id: "te-sealtite",
        slang: "Sealtite",
        officialTerm: "Liquidtight Flexible Metal Conduit (LFMC)",
        reference: "Article 350",
        description:
          'Translating slang to "Liquidtight Flexible Metal Conduit" (LFMC).',
      },
      {
        id: "te-bx",
        slang: "BX",
        officialTerm: "Armored Cable (Type AC)",
        reference: "Article 320",
        description:
          'Translating legacy slang to "Armored Cable" (Type AC).',
      },
      {
        id: "te-teck-cable",
        slang: "Teck Cable",
        officialTerm: "Metal-Clad Cable (Type MC)",
        reference: "Article 330",
        description: 'Translating slang to "Metal-Clad Cable" (Type MC).',
      },
      {
        id: "te-peckerhead",
        slang: "Peckerhead",
        officialTerm: "Motor Terminal Housing",
        reference: "430.12",
        description: 'Translating slang to "Motor Terminal Housing".',
      },
      {
        id: "te-so-cord",
        slang: "SO Cord",
        officialTerm: "Flexible Cords and Cables",
        reference: "Article 400",
        description:
          'Translating job site cord naming to "Flexible Cords and Cables".',
      },
      {
        id: "te-wire-nut-bug",
        slang: "Wire Nut / Bug",
        officialTerm: "Splices",
        reference: "110.14(B)",
        description:
          'Translating slang to official rules for "Splices" and conductor connections.',
      },
      {
        id: "te-pancake-box",
        slang: "Pancake Box",
        officialTerm: "Box Volume Allowance",
        reference: "314.16(A)",
        description:
          "Triggering volume allowance rules for shallow, surface-mounted luminaire boxes.",
      },
      {
        id: "te-j-box",
        slang: "J-Box",
        officialTerm: "Outlet, Device, Pull, and Junction Boxes",
        reference: "Article 314",
        description:
          'Translating slang to "Outlet, Device, Pull, and Junction Boxes".',
      },
      {
        id: "te-zip-cord",
        slang: "Zip Cord",
        officialTerm: "Fixture Wires",
        reference: "Article 402",
        description:
          'Translating slang to official rules for "Fixture Wires".',
      },
      {
        id: "te-t-stat-wire-c-wire",
        slang: "T-Stat Wire (C-Wire)",
        officialTerm: "Class 2 and Class 3 Remote-Control",
        reference: "Article 725",
        description:
          'Translating HVAC slang to "Class 2 and Class 3 Remote-Control" circuits.',
      },
      {
        id: "te-bug-eye",
        slang: "Bug-Eye",
        officialTerm: "Emergency Illumination",
        reference: "700.16",
        description:
          'Translating slang to "Emergency Illumination" requirements.',
      },
      
      {
        id: "te-chicago-bender",
        slang: "Chicago Bender",
        officialTerm: "Radius of Conduit Bends",
        reference: "Chapter 9, Table 2",
        description:
          'Looking up the "Radius of Conduit Bends" for bending equipment.',
      },
      {
        id: "te-can-light",
        slang: "Can Light",
        officialTerm: "Recessed Luminaires",
        reference: "Article 410, Part III",
        description:
          'Translating slang to "Recessed Luminaires" installation requirements.',
      },
      {
        id: "te-stub-up",
        slang: "Stub-up",
        officialTerm: "Underground Installations - Protection from Damage",
        reference: "300.5",
        description:
          'Translating slang to "Underground Installations - Protection from Damage".',
      },
      {
        id: "te-daisy-chain",
        slang: "Daisy Chain",
        officialTerm:
          "Continuity and Attachment of Equipment Grounding Conductors",
        reference: "250.148",
        description:
          'Translating slang to "Continuity and Attachment of Equipment Grounding Conductors".',
      },
      {
        id: "te-furring-strip-stand-off",
        slang: "Furring Strip / Stand-off",
        officialTerm: "Cables and Raceways Parallel to Framing Members",
        reference: "300.4(D)",
        description:
          'Translating slang to "Cables and Raceways Parallel to Framing Members".',
      },
    ],
  },
  {
    id: "pack-1",
    name: "Expansion Pack 1",
    cards: [
      {
        id: "te-splitter-power-block",
        slang: "Splitter / Power Block",
        officialTerm: "Power Distribution Blocks",
        reference: "314.28(E)",
        description:
          'Translating slang to "Power Distribution Blocks" inside pull boxes.',
      },
      {
        id: "te-cadweld-c-tap",
        slang: "Cadweld / C-Tap",
        officialTerm: "Exothermic Welding",
        reference: "250.70",
        description:
          'Translating brand names/slang to "Exothermic Welding" or "Irreversible Compression".',
      },
      {
        id: "te-pigtail-grounding",
        slang: "Pigtail (Grounding)",
        officialTerm:
          "Continuity and Attachment of Equipment Grounding Conductors",
        reference: "250.148",
        description:
          "Continuity and attachment of equipment grounding conductors to boxes.",
      },
      {
        id: "te-fixture-whip",
        slang: "Fixture Whip",
        officialTerm: "Luminaire Flexible Cord/Conduit Connection",
        reference: "410.117(C)",
        description:
          "Translating slang to the rules for flexible cord/conduit connecting luminaires.",
      },
      {
        id: "te-underwriters-knot",
        slang: "Underwriters Knot",
        officialTerm: "Pull at Joints and Terminals",
        reference: "400.14",
        description:
          'Translating cord-tying methods to "Pull at Joints and Terminals" (Strain relief).',
      },
      {
        id: "te-duct-seal-monkey-shit",
        slang: "Duct Seal",
        officialTerm: "Raceway Seals",
        reference: "300.5(G)",
        description:
          'Translating slang to official "Raceway Seals" requirements.',
      },
      {
        id: "te-redhead-anti-short",
        slang: "Redhead / Red Devil",
        officialTerm: "Boxes and Fittings for Type AC",
        reference: "320.40",
        description:
          'Translating slang to "Boxes and Fittings for Type AC" (insulating bushings).',
      },
      {
        id: "te-split-bolt-kearney",
        slang: "Split Bolt / Kearney",
        officialTerm: "Splices and Pressure Connectors",
        reference: "110.14",
        description:
          'Translating slang to "Splices and Pressure Connectors".',
      },
      {
        id: "te-robroy-ocal",
        slang: "Robroy / Ocal",
        officialTerm: "PVC-Coated RMC",
        reference: "344.10(A)(3)",
        description:
          'Translating brand names to "PVC-Coated RMC" or corrosion protection.',
      },
      {
        id: "te-trough-gutter",
        slang: "Trough / Gutter",
        officialTerm: "Metal Wireways",
        reference: "Article 376",
        description:
          'Translating slang to "Metal Wireways" and auxiliary gutters.',
      },
    ],
  },
  {
    id: "pack-2",
    name: "Expansion Pack 2",
    cards: [
      {
        id: "te-mud-ring-p-ring",
        slang: "Mud Ring / P-Ring",
        officialTerm: "Boxes In Wall or Ceiling",
        reference: "314.20",
        description:
          'Translating slang to "Boxes In Wall or Ceiling" (flush mounting rules).',
      },
      {
        id: "te-homerun",
        slang: "Homerun",
        officialTerm: "Multiwire Branch Circuits",
        reference: "210.4",
        description:
          'Translating slang to rules for "Multiwire Branch Circuits".',
      },
      {
        id: "te-polaris-lug",
        slang: "Polaris Lug",
        officialTerm: "Insulated Splicing Connectors",
        reference: "110.14(B)",
        description:
          'Translating brand name to "Insulated Splicing Connectors".',
      },
      {
        id: "te-gooseneck",
        slang: "Gooseneck",
        officialTerm: "Service Heads and Connections",
        reference: "230.54(B)",
        description:
          'Translating slang to "Service Heads and Connections".',
      },
      {
        id: "te-drip-loop",
        slang: "Drip Loop",
        officialTerm: "Service Drop Water Entry Prevention",
        reference: "230.54(F)",
        description:
          "Translating slang to rules preventing water entry on service drops.",
      },
      {
        id: "te-temp-power-pig",
        slang: "Temp Power / Pig",
        officialTerm: "Temporary Installations",
        reference: "Article 590",
        description:
          'Translating job site power slang to "Temporary Installations".',
      },
      {
        id: "te-drop-cord",
        slang: "Drop Cord",
        officialTerm: "Flexible Cords - Pendants",
        reference: "400.10(A)",
        description: 'Translating slang to "Flexible Cords - Pendants".',
      },
      {
        id: "te-plenum-tie-zip-tie",
        slang: "Plenum Tie / Zip Tie",
        officialTerm: "Cable Ties in Environmental Air Spaces",
        reference: "300.22(C)(1)",
        description:
          'Translating slang to "Cable Ties in Environmental Air Spaces".',
      },
      {
        id: "te-fire-alarm-wire-fpl",
        slang: "Fire Alarm Wire / FPL",
        officialTerm: "Fire Alarm Systems",
        reference: "Article 760",
        description: 'Translating slang to "Fire Alarm Systems".',
      },
      {
        id: "te-4-square",
        slang: "4-Square",
        officialTerm: "Standard Square Outlet Boxes",
        reference: "314.16(B)",
        description:
          'Translating slang to "Standard Square Outlet Boxes" and volume allowances.',
      },
    ],
  },
  {
    id: "pack-3",
    name: "Expansion Pack 3",
    cards: [
      {
        id: "te-tray-cable-tc",
        slang: "Cable Tray",
        officialTerm: "Power and Control Tray Cable",
        reference: "Article 336",
        description: 'Translating slang to "Power and Control Tray Cable".',
      },
      {
        id: "te-buss-busbar",
        slang: "Buss / Busbar",
        officialTerm: "Support and Arrangement of Busbars",
        reference: "408.3",
        description:
          'Translating slang to "Support and Arrangement of Busbars" in panels.',
      },
      {
        id: "te-jiffy-clip-strap",
        slang: "Jiffy Clip / Strap",
        officialTerm: "Securing and Supporting EMT/Raceways",
        reference: "358.30",
        description:
          'Translating slang to "Securing and Supporting EMT/Raceways".',
      },
      {
        id: "te-stakon-crimp",
        slang: "Stakon / Crimp",
        officialTerm: "Terminals",
        reference: "110.14(A)",
        description:
          'Translating brand name to "Terminals" (crimp-on connectors).',
      },
      {
        id: "te-madison-straps-f-straps",
        slang: "Madison Straps / F-Straps",
        officialTerm: "Mounting in Finished Surfaces",
        reference: "314.23(C)",
        description:
          'Translating slang to "Mounting in Finished Surfaces" (box supports).',
      },
      {
        id: "te-cut-in-box-old-work-box",
        slang: "Cut-in Box",
        officialTerm: "Mounting in Finished Surfaces",
        reference: "314.23(C)",
        description:
          'Translating slang to "Mounting in Finished Surfaces" (remodel boxes).',
      },
      {
        id: "te-tandem-piggyback-breaker",
        slang: "Tandem / Piggyback Breaker",
        officialTerm: "Maximum Number of Overcurrent Devices",
        reference: "408.54",
        description:
          'Translating slang to "Maximum Number of Overcurrent Devices" hardware restrictions.',
      },
      {
        id: "te-wago-push-in-connector",
        slang: "Wago / Push-in Connector",
        officialTerm: "Splicing Devices",
        reference: "110.14(B)",
        description:
          'Translating slang to official "Splicing Devices" rules.',
      },
      {
        id: "te-ko-seal-penny",
        slang: "KO Seal / Push Penny",
        officialTerm: "Closing Unused Openings",
        reference: "110.12(A)",
        description:
          'Translating slang to the rules for "Closing Unused Openings".',
      },
      {
        id: "te-pipe-dope",
        slang: "Pipe Dope",
        officialTerm: "Corrosion Protection",
        reference: "300.6 / 344.46",
        description:
          'Translating slang to "Corrosion Protection" and thread compound requirements for RMC.',
      },
    ],
  },
  {
    id: "pack-4",
    name: "Expansion Pack 4",
    cards: [
      {
        id: "te-noalox-penetrox",
        slang: "Noalox / Penetrox",
        officialTerm: "Anti-Oxidant Compounds",
        reference: "110.14 Info Note",
        description:
          'Translating brand names to "Anti-Oxidant Compounds" for aluminum.',
      },
      {
        id: "te-meyers-hub",
        slang: "Meyers Hub",
        officialTerm: "Damp and Wet Location Fittings",
        reference: "314.15",
        description:
          'Translating brand name to "Damp and Wet Location Fittings".',
      },
      {
        id: "te-erickson-threaded-union",
        slang: "Erickson / Threaded Union",
        officialTerm: "Threadless or Running Thread Alternatives",
        reference: "344.42(B)",
        description:
          "Translating slang for threadless or running thread alternatives.",
      },
      {
        id: "te-chase-nipple",
        slang: "Chase Nipple",
        officialTerm: "Conductors Entering Boxes",
        reference: "314.17(B)",
        description:
          'Translating slang to "Conductors Entering Boxes" and fittings.',
      },
      {
        id: "te-lb-lr-ll-body",
        slang: "LB / LR / LL Body",
        officialTerm: "Conduit Bodies Volume",
        reference: "314.16(C)",
        description:
          'Translating trade acronyms to "Conduit Bodies Volume".',
      },
      {
        id: "te-ats-transfer-switch",
        slang: "ATS / Transfer Switch",
        officialTerm: "Transfer Equipment",
        reference: "702.5",
        description:
          'Translating slang to "Transfer Equipment" for standby systems.',
      },
      {
        id: "te-service-mast-riser",
        slang: "Service Mast / Riser",
        officialTerm: "Service Masts as Supports",
        reference: "230.28",
        description: 'Translating slang to "Service Masts as Supports".',
      },
      {
        id: "te-acorn-ground-clamp",
        slang: "Acorn / Ground Clamp",
        officialTerm: "Methods of Grounding and Bonding Connection",
        reference: "250.70",
        description:
          'Translating slang to "Methods of Grounding and Bonding Connection".',
      },
      {
        id: "te-triplex-quadplex",
        slang: "Triplex / Quadplex",
        officialTerm: "Insulation or Covering on Service-Drop Conductors",
        reference: "230.22",
        description:
          'Translating slang to "Insulation or Covering on Service-Drop Conductors".',
      },
      {
        id: "te-ct-cabinet",
        slang: "CT Cabinet",
        officialTerm:
          "Equipment Connected to Supply Side of Service Disconnect",
        reference: "230.82(4)",
        description:
          'Translating slang to "Equipment Connected to Supply Side of Service Disconnect".',
      },
    ],
  },
  {
    id: "pack-5",
    name: "Expansion Pack 5",
    cards: [
      {
        id: "te-buck-boost",
        slang: "Buck-Boost",
        officialTerm: "Autotransformers",
        reference: "450.4",
        description: 'Translating slang to "Autotransformers".',
      },
      {
        id: "te-caddy-clip-t-bar-clip",
        slang: "Caddy Clip / T-Bar Clip",
        officialTerm: "Wiring Systems Installed Above Suspended Ceilings",
        reference: "300.11(B)",
        description:
          'Translating brand names to "Wiring Systems Installed Above Suspended Ceilings".',
      },
      {
        id: "te-spider-box",
        slang: "Spider Box",
        officialTerm: "Portable Distribution",
        reference: "590.6(A)",
        description:
          'Translating slang to "Portable Distribution" for temporary power.',
      },
      {
        id: "te-gutter-tap",
        slang: "Gutter Tap",
        officialTerm: "Splices and Taps in Wireways",
        reference: "376.56(A)",
        description:
          'Translating slang to "Splices and Taps in Wireways".',
      },
      {
        id: "te-chico-seal-off",
        slang: "Chico / Seal-off",
        officialTerm: "Sealing and Drainage in Class I Locations",
        reference: "501.15",
        description:
          'Translating brand name/slang to "Sealing and Drainage in Class I Locations".',
      },
      {
        id: "te-subpanel",
        slang: "Subpanel",
        officialTerm: "Panelboard",
        reference: "408.36 / 250.24(A)(5)",
        description:
          'Translating slang to "Panelboard" and the rules for separating neutral/grounds.',
      },
      {
        id: "te-vfd-drive",
        slang: "VFD / Drive",
        officialTerm: "Adjustable-Speed Drives",
        reference: "Article 430, Part X",
        description:
          'Translating job site slang to "Adjustable-Speed Drives".',
      },
      {
        id: "te-motor-starter",
        slang: "Motor Starter",
        officialTerm: "Motor Controllers",
        reference: "Article 430, Part VII",
        description: 'Translating slang to "Motor Controllers" requirements.',
      },
      {
        id: "te-heaters-overloads",
        slang: "Heaters / Overloads",
        officialTerm: "Motor Overload Protection",
        reference: "430.32",
        description:
          'Translating slang to "Motor Overload Protection" sizing.',
      },
      {
        id: "te-loto-lockout",
        slang: "LOTO / Lockout",
        officialTerm: "Lockable Disconnecting Means",
        reference: "110.25",
        description:
          'Translating slang to "Lockable Disconnecting Means".',
      },
    ],
  },
  {
    id: "pack-6",
    name: "Expansion Pack 6",
    cards: [
      {
        id: "te-tvss",
        slang: "TVSS",
        officialTerm: "Surge-Protective Devices (SPDs)",
        reference: "Article 242",
        description:
          'Translating legacy acronym to "Surge-Protective Devices (SPDs)".',
      },
      {
        id: "te-ev-charger",
        slang: "EV Charger",
        officialTerm: "Electric Vehicle Supply Equipment (EVSE)",
        reference: "Article 625",
        description:
          'Translating everyday terms to "Electric Vehicle Supply Equipment (EVSE)".',
      },
      {
        id: "te-heat-trace",
        slang: "Heat Trace",
        officialTerm: "Fixed Electric Heating Equipment for Pipelines",
        reference: "Article 427",
        description:
          'Translating slang to "Fixed Electric Heating Equipment for Pipelines".',
      },
      {
        id: "te-high-leg-stinger",
        slang: "High Leg",
        officialTerm: "High-Leg Delta",
        reference: "110.15",
        description:
          'Translating slang to "High-Leg Delta" marking and voltage requirements.',
      },
      {
        id: "te-lube-soap",
        slang: "Lube / Soap",
        officialTerm: "Wire Pulling Compound",
        reference: "300.18 Info Note",
        description:
          'Translating slang to "Wire Pulling Compound" restrictions on insulation.',
      },
      {
        id: "te-reamer-deburring-tool",
        slang: "Reamer",
        officialTerm: "Reaming",
        reference: "358.28 / 344.28",
        description:
          'Translating tool name to the strict requirement for "Reaming" cut conduits.',
      },
      {
        id: "te-all-thread-threaded-rod",
        slang: "All-Thread / Threaded Rod",
        officialTerm: "Suspended Ceilings",
        reference: "300.11(B)",
        description:
          'Translating slang to "Suspended Ceilings" and independent support wires.',
      },
      {
        id: "te-beam-clamp",
        slang: "Beam Clamp",
        officialTerm: "Securing and Supporting",
        reference: "300.11(A)",
        description:
          'Translating hardware slang to "Securing and Supporting" rules.',
      },
      {
        id: "te-self-tapper-tek-screw",
        slang: "Self-Tapper / Tek Screw",
        officialTerm: "Sheet Metal Screws",
        reference: "250.8(A)(6)",
        description:
          'Translating slang to "Sheet Metal Screws" (NOT permitted for grounding!).',
      },
      {
        id: "te-drywall-anchor-zip-it",
        slang: "Drywall Anchor / Zip-It",
        officialTerm: "Screws in Plasterboard Are Not Acceptable",
        reference: "314.23(D)",
        description:
          'Translating hardware slang to the rule that "Screws in plasterboard are not acceptable" for boxes.',
      },
    ],
  },
  {
    id: "pack-7",
    name: "Expansion Pack 7",
    cards: [
      {
        id: "te-nipple",
        slang: "Nipple",
        officialTerm: "Conduit Nipples",
        reference: "Chapter 9, Note 4",
        description:
          'Translating slang to "Conduit Nipples" (under 24 inches) allowing 60% fill.',
      },
      {
        id: "te-jockey-pump",
        slang: "Jockey Pump",
        officialTerm: "Pressure Maintenance Pump",
        reference: "695.1(B)",
        description:
          'Translating slang to "Pressure Maintenance Pump" (NOT governed by Fire Pump rules!).',
      },
      {
        id: "te-sj-cord",
        slang: "SJ Cord",
        officialTerm: "Junior Hard Service Cord",
        reference: "Table 400.4",
        description: 'Translating cable print to "Junior Hard Service Cord".',
      },
      {
        id: "te-power-strip",
        slang: "Power Strip",
        officialTerm: "Relocatable Power Tap",
        reference: "400.12",
        description:
          'Translating slang to "Relocatable Power Tap" and the rules against using them as fixed wiring.',
      },
      {
        id: "te-plug-in-transformer-wall-wart",
        slang: "Plug-in Transformer / Wall Wart",
        officialTerm: "Class 2 Power Source",
        reference: "Article 725",
        description:
          'Translating slang to "Class 2 Power Source" requirements.',
      },
      {
        id: "te-travellers-3-way-wire",
        slang: "Travellers / 3-Way Wire",
        officialTerm: "Switch Connections",
        reference: "404.2(A)",
        description:
          'Translating switch slang to "Switch Connections" rules.',
      },
      {
        id: "te-backstab-stab-in",
        slang: "Backstab / Stab-in",
        officialTerm: "Terminals",
        reference: "110.14(A)",
        description:
          'Translating slang to "Terminals" and push-in connection requirements.',
      },
      {
        id: "te-cheater-plug-ground-lifter",
        slang: "Cheater Plug / Ground Lifter",
        officialTerm: "Replacements",
        reference: "406.4(D)",
        description:
          'Translating hardware slang to the rules for "Replacements" requiring grounding.',
      },
      {
        id: "te-faceless-gfci-dead-front-gfci",
        slang: "Faceless GFCI / Dead-front GFCI",
        officialTerm: "GFCI Protection from Remote Location",
        reference: "210.8",
        description:
          'Translating device slang to GFCI "Protection from Remote Location".',
      },
      {
        id: "te-batwing-clip-t-bar-support",
        slang: "Batwing Clip / T-Bar Support",
        officialTerm: "Suspended Ceiling",
        reference: "300.11(B)",
        description:
          'Translating hardware slang to "Suspended Ceiling" support restrictions.',
      },
    ],
  },
  {
    id: "pack-8",
    name: "Expansion Pack 8",
    cards: [
      {
        id: "te-pothead-stress-cone",
        slang: "Pothead / Stress Cone",
        officialTerm: "Terminations",
        reference: "314.30 / 300.50",
        description:
          'Translating slang to high-voltage "Terminations" and pull box sizing.',
      },
      {
        id: "te-buchanan-crimp-sleeve",
        slang: "Buchanan / Crimp Sleeve",
        officialTerm: "Splices and Wire Connectors",
        reference: "110.14(B)",
        description:
          'Translating brand name to "Splices and Wire Connectors".',
      },
      {
        id: "te-j-hook-bridle-ring",
        slang: "J-Hook / Bridle Ring",
        officialTerm: "Mechanical Execution and Routing of Cables",
        reference: "300.4 / 800.24",
        description:
          'Translating hardware slang to "Mechanical Execution and Routing of Cables".',
      },
      {
        id: "te-belly-band-pipe-strap",
        slang: "Belly Band / Pipe Strap",
        officialTerm: "Bonding of Piping Systems",
        reference: "250.104",
        description:
          'Translating slang to the rules for "Bonding of Piping Systems".',
      },
      {
        id: "te-messenger-wire-guy-wire",
        slang: "Messenger Wire / Guy Wire",
        officialTerm: "Messenger-Supported Wiring",
        reference: "Article 396",
        description:
          'Translating overhead support slang to "Messenger-Supported Wiring".',
      },
      {
        id: "te-concentric-eccentric-ko",
        slang: "Concentric / Eccentric KO",
        officialTerm: "Bonding Requirements When KOs Are Present Over 250V",
        reference: "250.97",
        description:
          "Translating slang to bonding requirements when KOs are present over 250V.",
      },
      {
        id: "te-squeeze-connector-flex-fitting",
        slang: "Squeeze Connector / Flex Fitting",
        officialTerm: "FMC Securing and Fittings",
        reference: "348.42",
        description:
          'Translating slang to FMC "Securing and Fittings".',
      },
      {
        id: "te-button-snap-in-connector",
        slang: "Button / Snap-in Connector",
        officialTerm: "Securing Cable to Box",
        reference: "314.17(C)",
        description:
          'Translating slang to nonmetallic boxes and "Securing Cable to Box".',
      },
      {
        id: "te-drop-in-wedge-anchor",
        slang: "Drop-in / Wedge Anchor",
        officialTerm: "Supporting Enclosures to Masonry",
        reference: "314.23(D)",
        description:
          'Translating hardware slang to "Supporting Enclosures to Masonry".',
      },
      {
        id: "te-tails-make-up",
        slang: "Tails / Make-up",
        officialTerm: "Free Length of Conductors at Boxes",
        reference: "300.14",
        description:
          'Translating slang to the "Free Length of Conductors at Boxes" rule.',
      },
    ],
  },
  {
    id: "pack-9",
    name: "Expansion Pack 9",
    cards: [
      {
        id: "te-hickey-hand-bender",
        slang: "Hickey / Hand Bender",
        officialTerm: "Radius of Conduit Bends",
        reference: "Chapter 9, Table 2",
        description:
          'Translating tool name to lookup the minimum "Radius of Conduit Bends".',
      },
      {
        id: "te-caddy-mac-bracket-box",
        slang: "Caddy Mac / Bracket Box",
        officialTerm: "Structural Mounting",
        reference: "314.23(B)",
        description:
          'Translating brand name to rules for "Structural Mounting" on studs.',
      },
      {
        id: "te-t-tap-idc-connector",
        slang: "T-Tap / IDC Connector",
        officialTerm: "Splicing Wire Without Cutting the Main",
        reference: "110.14",
        description:
          'Translating slang to "Splicing Wire Without Cutting the Main" requirements.',
      },
      {
        id: "te-skinning-stripping",
        slang: "Skinning / Stripping",
        officialTerm: "Nicked Conductors",
        reference: "110.14(B)",
        description:
          'Translating slang to splices and the rule against "Nicked Conductors".',
      },
      {
        id: "te-switch-leg-dead-end",
        slang: "Switch Leg / Dead End",
        officialTerm: "Neutral at Switch Locations",
        reference: "404.2(C)",
        description:
          'Translating slang to the strict requirement for a "Neutral at Switch Locations".',
      },
      {
        id: "te-cat5-cat6-data",
        slang: "Cat5 / Cat6 / Data",
        officialTerm: "Communications Circuits",
        reference: "Article 800",
        description:
          'Translating network slang to "Communications Circuits".',
      },
      {
        id: "te-coax",
        slang: "Coax",
        officialTerm:
          "Community Antenna Television and Radio Distribution Systems",
        reference: "Article 820",
        description:
          'Translating slang to "Community Antenna Television and Radio Distribution Systems".',
      },
      {
        id: "te-twin-screw-romex-connector",
        slang: "Twin-Screw / Romex Connector",
        officialTerm: "Securing Cable to Box or Fittings",
        reference: "314.17(B)",
        description:
          'Translating hardware slang to "Securing Cable to Box or Fittings".',
      },
      {
        id: "te-meter-can-meter-base",
        slang: "Meter Can / Meter Base",
        officialTerm: "Service Equipment - Enclosures",
        reference: "230.66",
        description:
          'Translating slang to "Service Equipment - Enclosures".',
      },
      {
        id: "te-disco",
        slang: "Disco",
        officialTerm: "Motor Disconnecting Means",
        reference: "Article 430, Part IX",
        description:
          'Translating shorthand slang to "Motor Disconnecting Means".',
      },
    ],
  },
  {
    id: "pack-10",
    name: "Expansion Pack 10",
    cards: [
      {
        id: "te-shared-neutral",
        slang: "Shared Neutral",
        officialTerm: "Multiwire Branch Circuits",
        reference: "210.4",
        description:
          'Translating slang to the rules for "Multiwire Branch Circuits".',
      },
      {
        id: "te-hot-phase-leg",
        slang: "Hot / Phase / Leg",
        officialTerm: "Conductor, Ungrounded",
        reference: "Article 100",
        description:
          'Translating everyday slang to the definition of a "Conductor, Ungrounded".',
      },
      {
        id: "te-service-lateral",
        slang: "Service Lateral",
        officialTerm: "Underground Service Conductors",
        reference: "230.30",
        description:
          'Translating slang to "Underground Service Conductors".',
      },
      {
        id: "te-sleeve",
        slang: "Sleeve",
        officialTerm: "Protection from Physical Damage",
        reference: "300.15(C)",
        description:
          'Translating slang to rules for "Protection from Physical Damage" for cables.',
      },
      {
        id: "te-locknut",
        slang: "Locknut",
        officialTerm: "Bonding for Over 250 Volts",
        reference: "250.97",
        description:
          'Translating hardware slang to "Bonding for Over 250 Volts".',
      },
      {
        id: "te-building-steel",
        slang: "Building Steel",
        officialTerm: "Metal In-ground Support Structure / Structural Metal",
        reference: "250.52(A)(2)",
        description:
          'Translating slang to "Metal In-ground Support Structure / Structural Metal".',
      },
      {
        id: "te-water-main",
        slang: "Water Main",
        officialTerm: "Metal Underground Water Pipe",
        reference: "250.52(A)(1)",
        description:
          'Translating slang to "Metal Underground Water Pipe" grounding rules.',
      },
      {
        id: "te-ground-plate",
        slang: "Ground Plate",
        officialTerm: "Plate Electrodes",
        reference: "250.52(A)(7)",
        description:
          'Translating slang to "Plate Electrodes" sizing and depth rules.',
      },
      {
        id: "te-h-tap",
        slang: "H-Tap",
        officialTerm: "Splices",
        reference: "110.14 / 250.70",
        description:
          'Translating slang to "Splices" and "Exothermic or Irreversible" terminations.',
      },
      {
        id: "te-lug",
        slang: "Lug",
        officialTerm: "Terminals",
        reference: "110.14(A)",
        description:
          'Translating everyday slang to "Terminals" and torque requirements.',
      },
    ],
  },
  {
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
        id: "te-wire-chart",
        slang: "Wire Chart / Ampacity Table",
        officialTerm: "Allowable Ampacities of Insulated Conductors",
        reference: "Table 310.16",
        description:
          'Translating slang to "Allowable Ampacities of Insulated Conductors" rated 0–2000V.',
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
      {
        id: "te-temp-correction",
        slang: "Temp Correction Chart",
        officialTerm: "Ambient Temperature Correction Factors",
        reference: "Table 310.15(B)(1)",
        description:
          'Translating slang to "Ambient Temperature Correction Factors" for ampacity adjustment above 30°C.',
      },
    ],
  },
];

/** Derived flat array of all cards across all packs */
export const TRANSLATION_CARDS: TranslationCard[] = TRANSLATION_PACKS.flatMap(
  (p) => p.cards,
);

/** Fisher-Yates shuffle — returns a new array */
export function shuffleCards(cards: TranslationCard[]): TranslationCard[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns `count` unique random official terms from the pool,
 * excluding `correctOfficialTerm`. Results are shuffled.
 */
export function getDistractors(
  correctOfficialTerm: string,
  allCards: TranslationCard[],
  count: number,
): string[] {
  const pool = allCards
    .map((c) => c.officialTerm)
    .filter((term) => term !== correctOfficialTerm);

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
  return TRANSLATION_PACKS.map((p) => p.id);
}

/** Filter cards by unlocked packs */
export function getUnlockedCards(unlockedPacks: string[]): TranslationCard[] {
  const set = new Set(unlockedPacks);
  return TRANSLATION_PACKS.filter((p) => set.has(p.id)).flatMap(
    (p) => p.cards,
  );
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
  "Translated!",
  "Decoded!",
  "Fluent!",
  "Code-speak mastered!",
  "Perfect translation!",
  "NEC native speaker!",
  "Slang cracked!",
  "Sparky speaks fluent Code!",
];

export const TRIP_MESSAGES = [
  "Lost in translation — try again!",
  "That slang doesn't map there. Check again!",
  "Mistranslation! Here's the official term.",
  "Not quite — the Code says it differently.",
  "Wrong translation — Sparky's got the answer.",
];
