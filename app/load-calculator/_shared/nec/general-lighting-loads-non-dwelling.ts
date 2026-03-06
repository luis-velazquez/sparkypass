// Minimum Lighting Load by Occupancy (Non-Dwelling)
// NEC 2020: Table 220.12 → NEC 2023: Table 220.42(A) → NEC 2026: Table 120.42(A)
// Data is identical across editions — only the table number changed.
// VA per square foot — the 125% continuous load multiplier per 210.20(A) is
// already included in these values, so NO additional multiplier is needed.

import type { NecVersion } from "@/types/question";

const TABLE_REF: Record<NecVersion, string> = {
  "2023": "Table 220.42(A)",
  "2026": "Table 120.42(A)",
};

/** Returns the correct NEC table number for the user's selected code year. */
export function getLightingLoadTableRef(version: NecVersion): string {
  return TABLE_REF[version];
}

export const LIGHTING_LOAD_TABLE: Record<string, { vaPerSqFt: number; label: string }> = {
  automotive:            { vaPerSqFt: 1.5,  label: "Automotive Facility" },
  convention_center:     { vaPerSqFt: 1.4,  label: "Convention Center" },
  courthouse:            { vaPerSqFt: 1.4,  label: "Courthouse" },
  dormitory:             { vaPerSqFt: 1.5,  label: "Dormitory" },
  exercise_center:       { vaPerSqFt: 1.4,  label: "Exercise Center" },
  fire_station:          { vaPerSqFt: 1.3,  label: "Fire Station" },
  gymnasium:             { vaPerSqFt: 1.7,  label: "Gymnasium" },
  health_care_clinic:    { vaPerSqFt: 1.6,  label: "Health Care Clinic" },
  hospital:              { vaPerSqFt: 1.6,  label: "Hospital" },
  hotel:                 { vaPerSqFt: 1.7,  label: "Hotel/Motel" },
  library:               { vaPerSqFt: 1.5,  label: "Library" },
  manufacturing:         { vaPerSqFt: 2.2,  label: "Manufacturing Facility" },
  motion_picture_theater: { vaPerSqFt: 1.6, label: "Motion Picture Theater" },
  museum:                { vaPerSqFt: 1.6,  label: "Museum" },
  office:                { vaPerSqFt: 1.3,  label: "Office" },
  parking_garage:        { vaPerSqFt: 0.3,  label: "Parking Garage" },
  penitentiary:          { vaPerSqFt: 1.2,  label: "Penitentiary" },
  performing_arts_theater: { vaPerSqFt: 1.3, label: "Performing Arts Theater" },
  police_station:        { vaPerSqFt: 1.3,  label: "Police Station" },
  post_office:           { vaPerSqFt: 1.6,  label: "Post Office" },
  religious:             { vaPerSqFt: 2.2,  label: "Religious Facility" },
  restaurant:            { vaPerSqFt: 1.5,  label: "Restaurant" },
  retail:                { vaPerSqFt: 1.9,  label: "Retail Store" },
  school:                { vaPerSqFt: 1.5,  label: "School/University" },
  sports_arena:          { vaPerSqFt: 1.5,  label: "Sports Arena" },
  town_hall:             { vaPerSqFt: 1.4,  label: "Town Hall" },
  transportation:        { vaPerSqFt: 1.2,  label: "Transportation Facility" },
  warehouse:             { vaPerSqFt: 1.2,  label: "Warehouse" },
  workshop:              { vaPerSqFt: 1.7,  label: "Workshop" },
};
