// Three-Phase Motor Full-Load Currents — NEC Table 430.250
// Same table number across 2020, 2023, and 2026 editions.
// Induction-Type Squirrel Cage and Wound Rotor (208V and 230V columns)

export const MOTOR_FLC_TABLE_3PHASE: Record<number, { v208: number; v230: number }> = {
  0.5:  { v208: 2.4,   v230: 2.2 },
  0.75: { v208: 3.5,   v230: 3.2 },
  1:    { v208: 4.6,   v230: 4.2 },
  1.5:  { v208: 6.6,   v230: 6 },
  2:    { v208: 7.5,   v230: 6.8 },
  3:    { v208: 10.6,  v230: 9.6 },
  5:    { v208: 16.7,  v230: 15.2 },
  7.5:  { v208: 24.2,  v230: 22 },
  10:   { v208: 30.8,  v230: 28 },
  15:   { v208: 46.2,  v230: 42 },
  20:   { v208: 59.4,  v230: 54 },
  25:   { v208: 74.8,  v230: 68 },
  30:   { v208: 88,    v230: 80 },
  40:   { v208: 114,   v230: 104 },
  50:   { v208: 143,   v230: 130 },
};

// Get 3-phase motor FLC from Table 430.250
export function getMotorAmps3Phase(hp: number, voltage: number): number {
  const entry = MOTOR_FLC_TABLE_3PHASE[hp];
  if (!entry) return 0;
  return voltage <= 208 ? entry.v208 : entry.v230;
}
