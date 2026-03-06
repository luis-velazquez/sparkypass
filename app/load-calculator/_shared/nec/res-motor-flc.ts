// Residential Motor Full-Load Currents — NEC Table 430.248
// Single-Phase Motor FLC. Same table number across 2020, 2023, and 2026 editions.
// Maps HP to Amps at 115V and 230V (table columns)
// User inputs 120V or 240V, we use 115V or 230V column for lookup

export const MOTOR_FLC_TABLE: Record<number, { v115: number; v230: number }> = {
  0.167: { v115: 4.4, v230: 2.2 },   // 1/6 HP
  0.25: { v115: 5.8, v230: 2.9 },    // 1/4 HP
  0.333: { v115: 7.2, v230: 3.6 },   // 1/3 HP
  0.5: { v115: 9.8, v230: 4.9 },     // 1/2 HP
  0.75: { v115: 13.8, v230: 6.9 },   // 3/4 HP
  1: { v115: 16, v230: 8 },          // 1 HP
  1.5: { v115: 20, v230: 10 },       // 1.5 HP
  2: { v115: 24, v230: 12 },         // 2 HP
  3: { v115: 34, v230: 17 },         // 3 HP
  5: { v115: 56, v230: 28 },         // 5 HP
  7.5: { v115: 80, v230: 40 },       // 7.5 HP
  10: { v115: 100, v230: 50 },       // 10 HP
};

// Helper to get FLC amps from HP and voltage
// User voltage is 120 or 240, we use 115 or 230 column
export function getMotorAmps(hp: number, userVoltage: 120 | 240): number {
  const tableColumn = userVoltage === 120 ? "v115" : "v230";
  const entry = MOTOR_FLC_TABLE[hp];
  if (!entry) {
    // Interpolate or use closest value
    const hpValues = Object.keys(MOTOR_FLC_TABLE).map(Number).sort((a, b) => a - b);
    const closest = hpValues.reduce((prev, curr) =>
      Math.abs(curr - hp) < Math.abs(prev - hp) ? curr : prev
    );
    const closestEntry = MOTOR_FLC_TABLE[closest];
    return closestEntry[tableColumn];
  }
  return entry[tableColumn];
}

// Helper to convert HP to Watts via Table 430.248
// Lookup uses 115/230 column, but multiply by actual voltage (120/240)
export function hpToWatts(hp: number, userVoltage: 120 | 240): number {
  const amps = getMotorAmps(hp, userVoltage);
  return Math.round(amps * userVoltage);
}
