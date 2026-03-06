import type { HouseScenario } from "../types";
import { STANDARD_APPLIANCES } from "../standard-appliances";

export const SMALL_DWELLING: HouseScenario = {
  id: "small",
  name: "Small Dwelling",
  squareFootage: 1200,
  voltage: 240,
  description: "A modest 1,200 sq ft dwelling unit with basic appliances",
  difficulty: "beginner",
  appliances: [
    ...STANDARD_APPLIANCES,
    { id: "range", name: "Electric Range", watts: 9600, necReference: "Table 220.55" },
    { id: "dryer", name: "Electric Dryer", watts: 5000, necReference: "220.54" },
    { id: "water-heater", name: "Water Heater", watts: 4500, necReference: "220.53" },
    { id: "dishwasher", name: "Dishwasher", watts: 1200, necReference: "220.53" },
    { id: "ac", name: "A/C (2 HP @ 240V)", watts: 0, horsepower: 2, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    { id: "heat", name: "Electric Heat", watts: 10000, necReference: "220.60" },
  ],
};
