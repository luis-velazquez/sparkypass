import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

// ─── Apartment (beginner) ─────────────────────────────────────────────────────
// The simplest scenario. No dryer, no fixed-appliance motors, heat wins clearly.
//
// Lighting: 900 × 3 = 2,700 VA
// Small appliance + laundry: 4,500 VA → Subtotal: 7,200
// Demand: 3,000@100% + 4,200@35% = 3,000 + 1,470 = 4,470 VA
//
// Range: 8kW ≤ 12kW → Column A = 8,000 VA
//
// HVAC: A/C 1.5HP@240V → 10A × 240 = 2,400 VA × 1.25 = 3,000 VA
//       Heat 8,000 VA → max(3,000, 8,000) = 8,000 (heat wins)
//
// Fixed appliances (2 items, 100%):
//   Water Heater 3,500 + Dishwasher 1,200 = 4,700 VA
//
// No dryer, no other motors, motor step skipped (heat won, A/C excluded)
//
// Total: 4,470 + 8,000 + 8,000 + 4,700 = 25,170 VA
// Service: 25,170 ÷ 240 = 104.9 → 105A

export const APARTMENT: HouseScenario = {
  id: "apartment",
  name: "Apartment",
  squareFootage: 900,
  voltage: 240,
  description: "A compact 900 sq ft apartment with basic appliances and no dryer",
  difficulty: "beginner",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Electric Range", watts: 8000, necReference: "Table 220.55" },
    { id: "water-heater", name: "Water Heater", watts: 3500, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 1200, necReference: "220.53" },
    { id: "ac", name: "A/C (1.5 HP @ 240V)", watts: 0, horsepower: 1.5, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat", watts: 8000, necReference: "220.60" },
  ],
};
