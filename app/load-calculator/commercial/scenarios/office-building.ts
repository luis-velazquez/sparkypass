import type { CommercialScenario } from "../types";

// ─── Variant 1 (existing, intermediate) — Heat wins, multioutlet, elevator motor ─
// A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
// Elevator: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA
// Lighting: 15000×1.3 = 19,500 (100% demand) | Outlets: 57,000
// Receptacle demand: (57,000−1,200 sign)=55,800 → demand 32,900 + 1,200 sign = 34,100
// HVAC: max(13,869, 40,000) = 40,000 (heat wins, A/C excluded)
// Motors: Elevator 8,718 | Largest motor 25%: 8,718×25% = 2,180 (only non-HVAC motors, heat won)
// Total: 19,500+40,000+34,100+0+8,718+2,180 = 104,498 VA
// Service: 104,498 ÷ 360 = 290.3 → 290A per 220.5(B) → 350 kcmil Cu (310A) / 500 kcmil Al (310A) → 2 AWG GEC

// ─── Variant 2 (intermediate) — AC wins, smaller office, different motor ──────
// A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
// Elevator: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
// Lighting: 8000×1.3 = 10,400 (100% demand)
// Outlets: 150×180+30×180+1,200 = 33,600
// Receptacle demand: (33,600−1,200 sign)=32,400 → first 10k@100%+22,400@50% = 21,200 + 1,200 sign = 22,400
// HVAC: max(20,800, 12,000) = 20,800 (AC wins @125%)
// Motors: 6,016 | Largest motor 25%: AC base 16,640 is largest → 16,640×25% = 4,160
// Total: 10,400+20,800+22,400+6,016+4,160 = 63,776 VA
// Service: 63,776 ÷ 360 = 177.2 → 178A per 220.5(B) → 2/0 Cu (175A) → 4 AWG GEC
// Note: 178A > 175A for 2/0 — need 3/0 Cu (200A) → 4 AWG GEC

// ─── Variant 3 (beginner) — Heat wins, no multioutlet, small building ─────────
// A/C: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA → @125% = 7,520 VA
// Elevator: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
// Lighting: 5000×1.3 = 6,500 (100% demand)
// Outlets: 80×180+1,200 sign = 15,600
// Receptacle demand: (15,600−1,200 sign)=14,400 → first 10k@100%+4,400@50% = 12,200 + 1,200 sign = 13,400
// HVAC: max(7,520, 18,000) = 18,000 (heat wins, A/C excluded)
// Motors: 3,819 | Largest motor 25%: 3,819×25% = 955
// Total: 6,500+18,000+13,400+3,819+955 = 42,674 VA
// Service: 42,674 ÷ 360 = 118.5 → 119A per 220.5(B) → 1 AWG Cu (130A) → 6 AWG GEC

export const OFFICE_BUILDING_VARIANTS: CommercialScenario[] = [
  {
    id: "office-1",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 15000,
    voltage: 208,
    phases: 3,
    description: "A 15,000 sq ft office building with 120/208V 3Ø service, multioutlet assemblies, and large HVAC system",
    difficulty: "intermediate",
    lampholders: 0,
    receptacles: 250,
    multioutletAssemblyFeet: 60,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 40000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 7.5, voltage: 208, phase: 3 },
    ],
  },
  {
    id: "office-2",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 8000,
    voltage: 208,
    phases: 3,
    description: "An 8,000 sq ft office building with 120/208V 3Ø service, multioutlet assemblies, and high-efficiency A/C",
    difficulty: "intermediate",
    lampholders: 0,
    receptacles: 150,
    multioutletAssemblyFeet: 30,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 12000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 5, voltage: 208, phase: 3 },
    ],
  },
  {
    id: "office-3",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 5000,
    voltage: 208,
    phases: 3,
    description: "A 5,000 sq ft small office building with 120/208V 3Ø service and a freight elevator",
    difficulty: "beginner",
    lampholders: 0,
    receptacles: 80,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 5, voltage: 208, phase: 3 },
    heatWatts: 18000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 3, voltage: 208, phase: 3 },
    ],
  },
];
