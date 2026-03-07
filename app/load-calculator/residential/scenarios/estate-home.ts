import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

// ─── Estate Home (expert) ──────────────────────────────────────────────────────
// 7,500 sq ft, 2 cooking appliances (Note 2), tight HVAC comparison
//
// Lighting: 7,500 × 3 = 22,500 VA
// Small appliance + laundry: 4,500 VA → Subtotal: 27,000 VA
// Demand: 3,000@100% + 24,000@35% = 3,000 + 8,400 = 11,400 VA
//
// Cooking (Note 2 — 2 appliances):
//   Range 18kW (already ≥12), Cooktop 8kW (adjust to 12kW min)
//   Adjusted: 18, 12 → Average: (18+12)/2 = 15 kW
//   Column C for 2 appliances: 11 kW
//   Average 15 exceeds 12 by 3 → 3 × 5% = 15% increase
//   11,000 × 1.15 = 12,650 VA
//
// A/C: 7.5HP@240V → 40A × 240 = 9,600 VA × 1.25 = 12,000 VA
// Heat: 12,000 VA → max(12,000, 12,000) = 12,000 (tie → A/C wins per >=)
//
// Fixed appliances (7 items → 75%):
//   Water Heater: 6,000, Dishwasher: 2,000
//   Disposal: 3/4HP@120V → 13.8A × 120 = 1,656 VA
//   Microwave: 2,200, Wine Cooler: 800
//   Pool Pump: 3HP@240V → 17A × 240 = 4,080 VA
//   Hot Tub: 9,000
//   Total: 6,000+2,000+1,656+2,200+800+4,080+9,000 = 25,736
//   25,736 × 75% = 19,302 VA
//
// Dryer: 7,500 VA (> 5,000 min)
//
// EV Charger: 11,520 VA (other load)
//
// Motors in calc (A/C won → A/C included):
//   A/C 9,600, Disposal 1,656, Pool Pump 4,080
//   Largest = 9,600 → 25% = 2,400
//
// Total: 11,400+12,000+19,302+7,500+12,650+2,400+11,520 = 76,772 VA
// Service: 76,772 ÷ 240 = 319.9 → 320A

export const ESTATE_HOME: HouseScenario = {
  id: "estate-home",
  name: "Estate Home",
  squareFootage: 7500,
  voltage: 240,
  description: "A luxurious 7,500 sq ft estate with dual cooking stations, large pool, and tight HVAC comparison",
  difficulty: "expert",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Commercial-Style Range", watts: 18000, necReference: "Table 220.55" },
    { id: "cooktop", name: "Separate Cooktop", watts: 8000, necReference: "Table 220.55" },
    { id: "dryer", name: "Electric Dryer", watts: 7500, necReference: "220.54" },
    { id: "water-heater", name: "Water Heater (large)", watts: 6000, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 2000, necReference: "220.53" },
    { id: "disposal", name: "Disposal (3/4 HP @ 120V)", watts: 0, horsepower: 0.75, motorVoltage: 120, isMotor: true, necReference: "Table 430.248" },
    { id: "microwave", name: "Microwave (built-in)", watts: 2200, necReference: "220.53" },
    { id: "wine-cooler", name: "Wine Cooler", watts: 800, necReference: "220.53" },
    { id: "ac", name: "A/C (7.5 HP @ 240V)", watts: 0, horsepower: 7.5, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat", watts: 12000, necReference: "220.60" },
    { id: "pool-pump", name: "Pool Pump (3 HP @ 240V)", watts: 0, horsepower: 3, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "hot-tub", name: "Hot Tub/Spa", watts: 9000, necReference: "680.44" },
    { id: "ev-charger", name: "EV Charger", watts: 11520, necReference: "625.41" },
  ],
};
