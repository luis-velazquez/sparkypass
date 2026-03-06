import type { CommercialScenario } from "../types";

// ─── Variant 1 (existing, intermediate) — AC wins (0 heat), 2 other motors, tiered lighting ─
// A/C: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA → @125% = 7,520 VA
// Conveyor: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
// Dock Door: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
// Lighting: 18,000 → demand 15,250 (warehouse: first 12,500@100%, rest@50%)
// Outlets: 19,200 | Receptacle demand: (19,200−1,200 sign)=18,000 → demand 14,000 + 1,200 sign = 15,200
// HVAC: max(7,520, 0) = 7,520 (A/C wins @125%) | Motors: 3,819+2,378 = 6,197
// Largest motor 25%: A/C(6,016 base) is largest in calc → 6,016×25% = 1,504
// Total: 15,250+7,520+15,200+0+6,197+1,504 = 45,671 VA
// Service: 45,671 ÷ 360 = 126.9 → 127A per 220.5(B) → 1 AWG Cu (130A) / 2/0 Al (135A) → 6 AWG GEC

// ─── Variant 2 (beginner) — Heat wins, 1 other motor, lighting under 12.5kVA tier ─
// A/C: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA → @125% = 4,774 VA
// Dock Door: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
// Lighting: 8000×1.2 = 9,600 → under 12,500 → 100% demand = 9,600
// Outlets: 15×180+24×180+1,200 sign = 8,220
// Receptacle demand: (8,220−1,200 sign)=7,020 → under 10kVA = 100% = 7,020 + 1,200 sign = 8,220
// HVAC: max(4,774, 8,000) = 8,000 (heat wins, A/C excluded)
// Motors: 2,378 | Largest motor 25%: 2,378×25% = 595
// Total: 9,600+8,000+8,220+2,378+595 = 28,793 VA
// Service: 28,793 ÷ 360 = 80.0 → 80A per 220.5(B) → 4 AWG Cu (85A) → 8 AWG GEC

// ─── Variant 3 (intermediate) — AC wins (0 heat), 3 other motors, large building ─
// A/C: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA → @125% = 10,898 VA
// Conveyor: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
// Dock Door: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
// Compactor: 1HP 3Ø@208V → 4.6A → 4.6×208×√3 = 1,657 VA
// Lighting: 20000×1.2 = 24,000 → demand 18,250 (warehouse: first 12,500@100%, 11,500@50%)
// Outlets: 25×180+30×180+1,200 sign = 11,100
// Receptacle demand: (11,100−1,200 sign)=9,900 → under 10kVA = 100% = 9,900 + 1,200 sign = 11,100
// HVAC: max(10,898, 0) = 10,898 (A/C wins @125%)
// Motors: 6,016+2,450+1,657 = 10,123 | Largest motor 25%: AC base 8,718 is largest → 8,718×25% = 2,180
// Total: 18,250+10,898+11,100+10,123+2,180 = 52,551 VA
// Service: 52,551 ÷ 360 = 146.0 → 146A per 220.5(B) → 1/0 Cu (150A) → 6 AWG GEC

export const WAREHOUSE_VARIANTS: CommercialScenario[] = [
  {
    id: "warehouse-1",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 15000,
    voltage: 208,
    phases: 3,
    description: "A 15,000 sq ft warehouse with 120/208V 3Ø service, heavy-duty lampholders, and multiple dock motors",
    difficulty: "intermediate",
    lampholders: 24,
    receptacles: 20,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 5, voltage: 208, phase: 3 },
    heatWatts: 0,
    otherMotors: [
      { name: "Conveyor Motor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Dock Door Motor", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },
  {
    id: "warehouse-2",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 8000,
    voltage: 208,
    phases: 3,
    description: "An 8,000 sq ft warehouse with 120/208V 3Ø service, lampholders, and a loading dock motor",
    difficulty: "beginner",
    lampholders: 12,
    receptacles: 15,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 3, voltage: 208, phase: 3 },
    heatWatts: 8000,
    otherMotors: [
      { name: "Dock Door Motor", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },
  {
    id: "warehouse-3",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 20000,
    voltage: 208,
    phases: 3,
    description: "A 20,000 sq ft distribution warehouse with 120/208V 3Ø service, conveyor system, and multiple motors",
    difficulty: "intermediate",
    lampholders: 30,
    receptacles: 25,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 7.5, voltage: 208, phase: 3 },
    heatWatts: 0,
    otherMotors: [
      { name: "Conveyor Motor", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Dock Door Motor", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Compactor Motor", horsepower: 1, voltage: 208, phase: 3 },
    ],
  },
];
