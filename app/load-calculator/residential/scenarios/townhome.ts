import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

// ─── Townhome (intermediate) ─────────────────────────────────────────────────
// Tests a single range > 12kW (Column C + 5% increase) and A/C winning.
// Exactly 4 fixed appliances (triggers 75% demand factor threshold).
//
// Lighting: 2,500 × 3 = 7,500 VA
// Small appliance + laundry: 4,500 VA → Subtotal: 12,000
// Demand: 3,000@100% + 9,000@35% = 3,000 + 3,150 = 6,150 VA
//
// Range: 14kW > 12kW → Column C = 8kW + (2kW over × 5% = 10%) → 8,800 VA
//
// HVAC: A/C 5HP@240V → 28A × 240 = 6,720 VA × 1.25 = 8,400 VA
//       Heat 8,000 VA → max(8,400, 8,000) = 8,400 (A/C wins)
//
// Fixed appliances (4 items → 75%):
//   Water Heater 5,000 + Dishwasher 1,500
//   Disposal 0.5HP@120V → 9.8A × 120 = 1,176 VA
//   Microwave 1,800
//   Total: 5,000 + 1,500 + 1,176 + 1,800 = 9,476
//   9,476 × 75% = 7,107 VA
//
// Dryer: max(5,500, 5,000) = 5,500 VA
//
// Motor 25%: A/C 6,720 > Disposal 1,176 → 6,720 × 0.25 = 1,680 VA
//
// Total: 6,150 + 8,800 + 8,400 + 7,107 + 5,500 + 1,680 = 37,637 VA
// Service: 37,637 ÷ 240 = 156.8 → 157A

export const TOWNHOME: HouseScenario = {
  id: "townhome",
  name: "Townhome",
  squareFootage: 2500,
  voltage: 240,
  description: "A spacious 2,500 sq ft townhome with a large range and disposal motor",
  difficulty: "intermediate",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Electric Range", watts: 14000, necReference: "Table 220.55" },
    { id: "dryer", name: "Electric Dryer", watts: 5500, necReference: "220.54" },
    { id: "water-heater", name: "Water Heater", watts: 5000, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 1500, necReference: "220.53" },
    { id: "disposal", name: "Disposal (1/2 HP @ 120V)", watts: 0, horsepower: 0.5, motorVoltage: 120, isMotor: true, necReference: "Table 430.248" },
    { id: "microwave", name: "Microwave (built-in)", watts: 1800, necReference: "220.53" },
    { id: "ac", name: "A/C (5 HP @ 240V)", watts: 0, horsepower: 5, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat", watts: 8000, necReference: "220.60" },
  ],
};
