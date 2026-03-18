import {
  shuffleArray,
  getEnergizeLevel as _getEnergizeLevel,
} from "../game-helpers";

export const ANCHOR_CATEGORIES = [
  "Conductors",
  "Grounding",
  "Motors",
  "Transformers",
  "Boxes",
  "Services",
  "Overcurrent Protection",
  "Luminaires",
  "Hazardous Locations",
  "Cables",
  "Conduit",
] as const;

export type AnchorCategory = (typeof ANCHOR_CATEGORIES)[number];

export interface AnchoringTerm {
  term: string;
  parent: AnchorCategory;
  tip: string;
}

export const ANCHORING_TERMS: AnchoringTerm[] = [
  // Conductors (4)
  {
    term: "THHN",
    parent: "Conductors",
    tip: "THHN is a conductor insulation type — look under 'Conductors' in the NEC Index, then find insulation types.",
  },
  {
    term: "THWN-2",
    parent: "Conductors",
    tip: "THWN-2 is a wet-rated conductor insulation — the NEC Index lists it under 'Conductors' with cross-references to Table 310.4(1).",
  },
  {
    term: "Ampacity",
    parent: "Conductors",
    tip: "Ampacity is the current-carrying capacity of a conductor — the Index anchors it under 'Conductors' and 'Ampacity' with Table 310.16 references.",
  },
  {
    term: "Parallel conductors",
    parent: "Conductors",
    tip: "Parallel conductors have specific rules in 310.10(G) — look under 'Conductors, parallel' in the NEC Index.",
  },
  // Grounding (4)
  {
    term: "GEC",
    parent: "Grounding",
    tip: "GEC (Grounding Electrode Conductor) is sized per Table 250.66 — the Index lists it under 'Grounding electrode conductor.'",
  },
  {
    term: "EGC",
    parent: "Grounding",
    tip: "EGC (Equipment Grounding Conductor) provides fault return path — look under 'Equipment grounding conductor' or 'Grounding' in the Index.",
  },
  {
    term: "Ground rod",
    parent: "Grounding",
    tip: "Ground rods are grounding electrodes covered in Article 250 — the Index lists them under 'Grounding electrode' and 'Rod electrodes.'",
  },
  {
    term: "Bonding jumper",
    parent: "Grounding",
    tip: "Bonding jumpers ensure electrical continuity — look under 'Bonding' or 'Bonding jumper' in the NEC Index for Article 250 references.",
  },
  // Motors (4)
  {
    term: "FLC",
    parent: "Motors",
    tip: "FLC (Full Load Current) for motors comes from Tables 430.248/250 — the Index lists it under 'Motors, full-load current.'",
  },
  {
    term: "Motor overload",
    parent: "Motors",
    tip: "Motor overload protection is covered in 430.32 — look under 'Motors, overload protection' in the NEC Index.",
  },
  {
    term: "Motor branch circuit",
    parent: "Motors",
    tip: "Motor branch circuit sizing uses 125% of FLC — the Index lists it under 'Motors, branch-circuit conductors.'",
  },
  {
    term: "Locked-rotor current",
    parent: "Motors",
    tip: "Locked-rotor current tables (Table 430.251) are used for motor starting — look under 'Motors, locked-rotor' in the Index.",
  },
  // Transformers (3)
  {
    term: "Transformer overcurrent",
    parent: "Transformers",
    tip: "Transformer overcurrent protection is in Article 450 — the Index lists it under 'Transformers, overcurrent protection' with Table 450.3 references.",
  },
  {
    term: "Transformer vault",
    parent: "Transformers",
    tip: "Transformer vaults have fire-resistance requirements in 450.41-48 — look under 'Transformers, vaults' in the NEC Index.",
  },
  {
    term: "Buck-boost transformer",
    parent: "Transformers",
    tip: "Buck-boost transformers adjust voltage levels — the Index lists them under 'Transformers' with autotransformer references in Article 450.",
  },
  {
    term: "Dry-type transformer",
    parent: "Transformers",
    tip: "Dry-type transformer installation rules are in 450.21-22 — look under 'Transformers, dry-type' in the NEC Index.",
  },
  // Boxes (4)
  {
    term: "Box fill",
    parent: "Boxes",
    tip: "Box fill calculations use Table 314.16(A) — the Index lists this under 'Boxes, box fill calculations' or 'Pull boxes.'",
  },
  {
    term: "Junction box",
    parent: "Boxes",
    tip: "Junction box requirements are in Article 314 — look under 'Boxes, junction' or 'Junction boxes' in the NEC Index.",
  },
  {
    term: "Pull box",
    parent: "Boxes",
    tip: "Pull box sizing rules (314.28) use conductor multiples — the Index anchors this under 'Boxes, pull' and 'Pull boxes.'",
  },
  {
    term: "Device box",
    parent: "Boxes",
    tip: "Device boxes must meet minimum depth requirements — look under 'Boxes, device' in the NEC Index for 314.24 references.",
  },
  // Services (3)
  {
    term: "Service entrance",
    parent: "Services",
    tip: "Service entrance conductors are covered in Article 230 — the Index lists them under 'Services, entrance conductors.'",
  },
  {
    term: "Service disconnect",
    parent: "Services",
    tip: "Service disconnect requirements are in 230.70-72 — look under 'Services, disconnecting means' in the NEC Index.",
  },
  {
    term: "Service drop",
    parent: "Services",
    tip: "Service drop clearances are in 230.24 — the Index lists them under 'Services, drop' or 'Service drop.'",
  },
  {
    term: "Service lateral",
    parent: "Services",
    tip: "Service lateral is the underground service conductor — look under 'Services, lateral' or 'Service lateral' in the NEC Index.",
  },
  // Overcurrent Protection (4)
  {
    term: "OCPD",
    parent: "Overcurrent Protection",
    tip: "OCPD (Overcurrent Protective Device) is the general term for breakers and fuses — the Index lists it under 'Overcurrent protection.'",
  },
  {
    term: "Ground fault protection",
    parent: "Overcurrent Protection",
    tip: "Ground fault protection of equipment (GFPE) is in 230.95 — look under 'Ground-fault protection' in the NEC Index.",
  },
  {
    term: "Coordination (selective)",
    parent: "Overcurrent Protection",
    tip: "Selective coordination ensures only the nearest OCPD trips — the Index lists it under 'Coordination, selective' or 'Overcurrent protection.'",
  },
  {
    term: "Standard ampere ratings",
    parent: "Overcurrent Protection",
    tip: "Standard OCPD ampere ratings are listed in 240.6(A) — look under 'Overcurrent protection, standard ratings' in the NEC Index.",
  },
  // Luminaires (3)
  {
    term: "Luminaire wiring",
    parent: "Luminaires",
    tip: "Luminaire wiring requirements are in Article 410 — the Index lists them under 'Luminaires, wiring' or 'Lighting fixtures.'",
  },
  {
    term: "Recessed luminaire",
    parent: "Luminaires",
    tip: "Recessed luminaire clearances and insulation contact ratings are in 410.116 — look under 'Luminaires, recessed' in the NEC Index.",
  },
  {
    term: "Track lighting",
    parent: "Luminaires",
    tip: "Track lighting rules are in 410.151-160 — the Index lists them under 'Luminaires, track lighting' or 'Lighting track.'",
  },
  {
    term: "Closet luminaire",
    parent: "Luminaires",
    tip: "Closet luminaire clearances are in 410.16 — look under 'Luminaires, clothes closets' in the NEC Index for allowed types and distances.",
  },
  // Hazardous Locations (3)
  {
    term: "Class I, Division 1",
    parent: "Hazardous Locations",
    tip: "Class I locations have flammable gases — Division 1 means normally hazardous. Look under 'Hazardous (classified) locations' in the NEC Index.",
  },
  {
    term: "Intrinsically safe",
    parent: "Hazardous Locations",
    tip: "Intrinsically safe circuits limit energy to prevent ignition — the Index lists them under 'Hazardous locations, intrinsically safe' (Article 504).",
  },
  {
    term: "Explosion-proof",
    parent: "Hazardous Locations",
    tip: "Explosion-proof equipment contains internal explosions — look under 'Hazardous locations' or 'Explosion-proof' in the NEC Index.",
  },
  {
    term: "Zone classification",
    parent: "Hazardous Locations",
    tip: "Zone classification (Articles 505/506) is the IEC alternative to Division — look under 'Hazardous locations, zone system' in the NEC Index.",
  },
  // Cables (4)
  {
    term: "NM cable (Romex)",
    parent: "Cables",
    tip: "NM (non-metallic sheathed) cable is covered in Article 334 — the Index lists it under 'Nonmetallic-sheathed cable' or 'NM cable.'",
  },
  {
    term: "MC cable",
    parent: "Cables",
    tip: "MC (metal-clad) cable requirements are in Article 330 — look under 'Metal-clad cable' or 'MC cable' in the NEC Index.",
  },
  {
    term: "AC cable (BX)",
    parent: "Cables",
    tip: "AC (armored cable/BX) is covered in Article 320 — the Index lists it under 'Armored cable' or 'AC cable (Type AC).'",
  },
  {
    term: "SE cable",
    parent: "Cables",
    tip: "SE (service entrance) cable is in Article 338 — look under 'Service-entrance cable' in the NEC Index.",
  },
  // Conduit (4)
  {
    term: "EMT",
    parent: "Conduit",
    tip: "EMT (Electrical Metallic Tubing) is in Article 358 — the Index lists it under 'Electrical metallic tubing' or 'EMT.'",
  },
  {
    term: "RMC",
    parent: "Conduit",
    tip: "RMC (Rigid Metal Conduit) is in Article 344 — look under 'Rigid metal conduit' or 'RMC' in the NEC Index.",
  },
  {
    term: "PVC conduit",
    parent: "Conduit",
    tip: "PVC conduit (rigid nonmetallic) is in Article 352 — the Index lists it under 'Rigid polyvinyl chloride conduit' or 'PVC.'",
  },
  {
    term: "Conduit fill",
    parent: "Conduit",
    tip: "Conduit fill percentages are in Chapter 9, Table 1 — look under 'Conduit, fill' or 'Raceways, number of conductors' in the NEC Index.",
  },
];

/** Fisher-Yates shuffle — returns a new array */
export const shuffleTerms = shuffleArray<AnchoringTerm>;

/** Returns energize level 0-4 based on streak. Thresholds: 5/10/15/20. */
export function getEnergizeLevel(streak: number): number {
  return _getEnergizeLevel(streak, [5, 10, 15, 20]);
}

export const CORRECT_REACTIONS = [
  "Nailed it!",
  "That's the right index path!",
  "You found it!",
  "Perfect lookup!",
  "Correct — you're wired in!",
  "Right on the money!",
  "Sparky approves!",
  "Index master!",
];

export const TRIP_MESSAGES = [
  "Wrong path — let's trace it back!",
  "Not quite — check the tip below!",
  "Oops! Let Sparky show you the way.",
  "Tripped up! Here's how to find it next time.",
  "Wrong anchor — review the lookup tip!",
];
