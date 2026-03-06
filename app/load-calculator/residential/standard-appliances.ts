// Standard appliances that appear in all dwelling unit scenarios
import type { Appliance } from "./types";

export const STANDARD_APPLIANCES: Appliance[] = [
  { id: "small-appliance-1", name: "Small Appliance Circuit 1", watts: 1500, isRequired: true, necReference: "220.52(A)" },
  { id: "small-appliance-2", name: "Small Appliance Circuit 2", watts: 1500, isRequired: true, necReference: "220.52(A)" },
  { id: "laundry", name: "Laundry Circuit", watts: 1500, isRequired: true, necReference: "220.52(B)" },
];
