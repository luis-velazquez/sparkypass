import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

// ─── Luxury Home (expert) ──────────────────────────────────────────────────────
// 10,000 sq ft, 3 cooking appliances (Note 2 with large ratings), heat wins
//
// Lighting: 10,000 × 3 = 30,000 VA
// Small appliance + laundry: 4,500 VA → Subtotal: 34,500 VA
// Demand: 3,000@100% + 31,500@35% = 3,000 + 11,025 = 14,025 VA
//
// Cooking (Note 2 — 3 appliances):
//   Range 16kW (already ≥12), Cooktop 10kW (adjust to 12kW min), Wall Oven 6kW (adjust to 12kW min)
//   Adjusted: 16, 12, 12 → Average: (16+12+12)/3 = 13.333 kW
//   Column C for 3 appliances: 14 kW
//   Average 13.333 exceeds 12 by 1.333 → round up to 2 kW → 2 × 5% = 10% increase
//   14,000 × 1.10 = 15,400 VA
//
// A/C: 10HP@240V → 50A × 240 = 12,000 VA × 1.25 = 15,000 VA
// Heat: 30,000 VA → max(15,000, 30,000) = 30,000 (heat wins)
//
// Fixed appliances (7 items → 75%):
//   Water Heater: 6,000, Dishwasher: 2,000
//   Disposal: 1HP@120V → 16A × 120 = 1,920 VA
//   Microwave: 2,500, Wine Cooler: 1,000
//   Pool Pump: 3HP@240V → 17A × 240 = 4,080 VA
//   Hot Tub: 12,000
//   Total: 6,000+2,000+1,920+2,500+1,000+4,080+12,000 = 29,500
//   29,500 × 75% = 22,125 VA
//
// Dryer: 8,000 VA (> 5,000 min)
//
// EV Charger: 11,520 VA (other load)
//
// Motors in calc (heat won → A/C excluded):
//   Disposal 1,920, Pool Pump 4,080
//   Largest = 4,080 → 25% = 1,020
//
// Total: 14,025+30,000+22,125+8,000+15,400+1,020+11,520 = 102,090 VA
// Service: 102,090 ÷ 240 = 425.4 → 426A

export const LUXURY_HOME: HouseScenario = {
  id: "luxury-home",
  name: "Luxury Home",
  squareFootage: 10000,
  voltage: 240,
  description: "A grand 10,000 sq ft luxury home with 3 large cooking appliances, pool, hot tub, and 30kW heating",
  difficulty: "expert",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Professional Range", watts: 16000, necReference: "Table 220.55" },
    { id: "cooktop", name: "Induction Cooktop", watts: 10000, necReference: "Table 220.55" },
    { id: "wall-oven", name: "Double Wall Oven", watts: 6000, necReference: "Table 220.55" },
    { id: "dryer", name: "Electric Dryer", watts: 8000, necReference: "220.54" },
    { id: "water-heater", name: "Water Heater (large)", watts: 6000, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 2000, necReference: "220.53" },
    { id: "disposal", name: "Disposal (1 HP @ 120V)", watts: 0, horsepower: 1, motorVoltage: 120, isMotor: true, necReference: "Table 430.248" },
    { id: "microwave", name: "Microwave (built-in)", watts: 2500, necReference: "220.53" },
    { id: "wine-cooler", name: "Wine Cooler", watts: 1000, necReference: "220.53" },
    { id: "ac", name: "A/C (10 HP @ 240V)", watts: 0, horsepower: 10, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat (zoned)", watts: 30000, necReference: "220.60" },
    { id: "pool-pump", name: "Pool Pump (3 HP @ 240V)", watts: 0, horsepower: 3, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "hot-tub", name: "Hot Tub/Spa (large)", watts: 12000, necReference: "680.44" },
    { id: "ev-charger", name: "EV Charger", watts: 11520, necReference: "625.41" },
  ],
};
