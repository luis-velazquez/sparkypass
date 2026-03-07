import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

// ─── Starter Home (beginner) ──────────────────────────────────────────────────
// Adds the dryer step and has A/C win the HVAC comparison. Motor 25% step
// applies because A/C is in the calc.
//
// Lighting: 1,500 × 3 = 4,500 VA
// Small appliance + laundry: 4,500 VA → Subtotal: 9,000
// Demand: 3,000@100% + 6,000@35% = 3,000 + 2,100 = 5,100 VA
//
// Range: 10kW ≤ 12kW → Column A = 8,000 VA
//
// HVAC: A/C 3HP@240V → 17A × 240 = 4,080 VA × 1.25 = 5,100 VA
//       Heat 5,000 VA → max(5,100, 5,000) = 5,100 (A/C wins)
//
// Fixed appliances (2 items, 100%):
//   Water Heater 4,500 + Dishwasher 1,500 = 6,000 VA
//
// Dryer: max(5,000, 5,000) = 5,000 VA
//
// Motor 25%: A/C 4,080 × 0.25 = 1,020 VA
//
// Total: 5,100 + 8,000 + 5,100 + 6,000 + 5,000 + 1,020 = 30,220 VA
// Service: 30,220 ÷ 240 = 125.9 → 126A

export const STARTER_HOME: HouseScenario = {
  id: "starter-home",
  name: "Starter Home",
  squareFootage: 1500,
  voltage: 240,
  description: "A cozy 1,500 sq ft starter home with basic appliances and a dryer",
  difficulty: "beginner",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Electric Range", watts: 10000, necReference: "Table 220.55" },
    { id: "dryer", name: "Electric Dryer", watts: 5000, necReference: "220.54" },
    { id: "water-heater", name: "Water Heater", watts: 4500, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 1500, necReference: "220.53" },
    { id: "ac", name: "A/C (3 HP @ 240V)", watts: 0, horsepower: 3, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat", watts: 5000, necReference: "220.60" },
  ],
};
