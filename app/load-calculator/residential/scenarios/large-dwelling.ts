import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

export const LARGE_DWELLING: HouseScenario = {
  id: "large",
  name: "Large Dwelling",
  squareFootage: 3500,
  voltage: 240,
  description: "A spacious 3,500 sq ft dwelling unit with premium appliances",
  difficulty: "intermediate",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Electric Range (double oven)", watts: 16000, necReference: "Table 220.55" },
    { id: "cooktop", name: "Separate Cooktop", watts: 6000, necReference: "Table 220.55" },
    { id: "dryer", name: "Electric Dryer", watts: 6000, necReference: "220.54" },
    { id: "water-heater", name: "Water Heater (large)", watts: 6000, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 1800, necReference: "220.53" },
    { id: "disposal", name: "Disposal (3/4 HP @ 120V)", watts: 0, horsepower: 0.75, motorVoltage: 120, isMotor: true, necReference: "Table 430.248" },
    { id: "microwave", name: "Microwave (built-in)", watts: 1800, necReference: "220.53" },
    { id: "wine-cooler", name: "Wine Cooler", watts: 500, necReference: "220.53" },
    { id: "ac", name: "A/C (5 HP @ 240V)", watts: 0, horsepower: 5, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat (zoned)", watts: 25000, necReference: "220.60" },
    { id: "pool-pump", name: "Pool Pump (1.5 HP @ 240V)", watts: 0, horsepower: 1.5, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "hot-tub", name: "Hot Tub/Spa", watts: 6000, necReference: "680.44" },
    { id: "ev-charger", name: "EV Charger", watts: 7200, necReference: "625.41" },
  ],
};
