import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

export const MEDIUM_DWELLING: HouseScenario = {
  id: "medium",
  name: "Medium Dwelling",
  squareFootage: 2000,
  voltage: 240,
  description: "A comfortable 2,000 sq ft dwelling unit with modern appliances",
  difficulty: "intermediate",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Electric Range", watts: 12000, necReference: "Table 220.55" },
    { id: "dryer", name: "Electric Dryer", watts: 5500, necReference: "220.54" },
    { id: "water-heater", name: "Water Heater", watts: 5500, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 1500, necReference: "220.53" },
    { id: "disposal", name: "Disposal (1/2 HP @ 120V)", watts: 0, horsepower: 0.5, motorVoltage: 120, isMotor: true, necReference: "Table 430.248" },
    { id: "microwave", name: "Microwave (built-in)", watts: 1500, necReference: "220.53" },
    { id: "ac", name: "A/C (3 HP @ 240V)", watts: 0, horsepower: 3, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat", watts: 15000, necReference: "220.60" },
    { id: "pool-pump", name: "Pool Pump (1 HP @ 240V)", watts: 0, horsepower: 1, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
  ],
};
