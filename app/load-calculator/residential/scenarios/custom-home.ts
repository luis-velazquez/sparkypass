import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

// ─── Custom Home (expert) ─────────────────────────────────────────────────────
// 5,500 sq ft, 3 cooking appliances (triggers Note 2)
//
// Lighting: 5,500 × 3 = 16,500 VA
// Small appliance + laundry: 4,500 VA → Subtotal: 21,000 VA
// Demand: 3,000@100% + 18,000@35% = 3,000 + 6,300 = 9,300 VA
//
// Cooking (Note 2 — 3 appliances):
//   Range 14kW, Cooktop 7kW (adjust to 12kW min), Wall Oven 4.5kW (adjust to 12kW min)
//   Adjusted: 14, 12, 12 → Average: (14+12+12)/3 = 12.667 kW
//   Column C for 3 appliances: 14 kW
//   Average 12.667 exceeds 12 by 0.667 → round up to 1 kW → 5% increase
//   14,000 × 1.05 = 14,700 VA
//
// A/C: 5HP@240V → 28A × 240 = 6,720 VA × 1.25 = 8,400 VA
// Heat: 20,000 VA → max(8,400, 20,000) = 20,000 (heat wins)
//
// Fixed appliances (7 items → 75%):
//   Water Heater: 6,000, Dishwasher: 1,800
//   Disposal: 1HP@120V → 16A × 120 = 1,920 VA
//   Microwave: 2,000, Wine Cooler: 600
//   Pool Pump: 2HP@240V → 12A × 240 = 2,880 VA
//   Hot Tub: 7,500
//   Total: 6,000+1,800+1,920+2,000+600+2,880+7,500 = 22,700
//   22,700 × 75% = 17,025 VA
//
// Dryer: 6,500 VA (> 5,000 min)
//
// EV Charger: 9,600 VA (other load)
//
// Motors in calc (heat won → A/C excluded):
//   Disposal 1,920, Pool Pump 2,880
//   Largest = 2,880 → 25% = 720
//
// Total: 9,300+20,000+17,025+6,500+14,700+720+9,600 = 77,845 VA
// Service: 77,845 ÷ 240 = 324.4 → 325A

export const CUSTOM_HOME: HouseScenario = {
  id: "custom-home",
  name: "Custom Home",
  squareFootage: 5500,
  voltage: 240,
  description: "A spacious 5,500 sq ft custom home with 3 cooking appliances, pool, hot tub, and EV charger",
  difficulty: "expert",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Electric Range (double oven)", watts: 14000, necReference: "Table 220.55" },
    { id: "cooktop", name: "Separate Cooktop", watts: 7000, necReference: "Table 220.55" },
    { id: "wall-oven", name: "Wall Oven", watts: 4500, necReference: "Table 220.55" },
    { id: "dryer", name: "Electric Dryer", watts: 6500, necReference: "220.54" },
    { id: "water-heater", name: "Water Heater", watts: 6000, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 1800, necReference: "220.53" },
    { id: "disposal", name: "Disposal (1 HP @ 120V)", watts: 0, horsepower: 1, motorVoltage: 120, isMotor: true, necReference: "Table 430.248" },
    { id: "microwave", name: "Microwave (built-in)", watts: 2000, necReference: "220.53" },
    { id: "wine-cooler", name: "Wine Cooler", watts: 600, necReference: "220.53" },
    { id: "ac", name: "A/C (5 HP @ 240V)", watts: 0, horsepower: 5, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat", watts: 20000, necReference: "220.60" },
    { id: "pool-pump", name: "Pool Pump (2 HP @ 240V)", watts: 0, horsepower: 2, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "hot-tub", name: "Hot Tub/Spa", watts: 7500, necReference: "680.44" },
    { id: "ev-charger", name: "EV Charger", watts: 9600, necReference: "625.41" },
  ],
};
