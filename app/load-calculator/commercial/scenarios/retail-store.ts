import type { CommercialScenario } from "../types";

// ─── Variant 1 (existing, beginner) — Heat wins, no other motors ─────────────
// A/C: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA → @125% = 7,520 VA
// Lighting: 3000×1.9 = 5,700 (100% demand) | Outlets: 56×180+30×200+1,200 = 17,280
// Receptacle demand: (17,280−1,200 sign)=16,080 → 10k@100%+6,080@50% = 13,040 + 1,200 sign = 14,240
// HVAC: max(7,520, 10,000) = 10,000 (heat wins, A/C excluded)
// Motors: 0 (no other motors) | Largest motor 25%: 0 (no motors in calc)
// Total: 5,700+10,000+14,240+0+0 = 29,940 VA
// Service: 29,940 ÷ 360 = 83.2 → 84A per 220.5(B) → 4 AWG Cu (85A) / 2 AWG Al (90A) → 8 AWG GEC

// ─── Variant 2 (intermediate) — AC wins, has other motor, larger building ─────
// A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
// Exhaust Fan: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
// Lighting: 5000×1.9 = 9,500 (100% demand)
// Outlets: 80×180+45×200+1,200 = 24,600
// Receptacle demand: (24,600−1,200 sign)=23,400 → first 10k@100%+13,400@50% = 16,700 + 1,200 sign = 17,900
// HVAC: max(13,869, 8,000) = 13,869 (AC wins @125%)
// Motors: 2,378 | Largest motor 25%: AC base 11,095 is largest → 11,095×25% = 2,774
// Total: 9,500+13,869+17,900+2,378+2,774 = 46,421 VA
// Service: 46,421 ÷ 360 = 128.9 → 129A per 220.5(B) → 1 AWG Cu (130A) → 6 AWG GEC

// ─── Variant 3 (beginner) — Heat wins, small store, recepts under 10kVA ──────
// A/C: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA → @125% = 4,774 VA
// Lighting: 1500×1.9 = 2,850 (100% demand)
// Outlets: 24×180+15×200+1,200 = 8,520
// Receptacle demand: (8,520−1,200 sign)=7,320 → under 10kVA = 100% = 7,320 + 1,200 sign = 8,520
// HVAC: max(4,774, 12,000) = 12,000 (heat wins, A/C excluded)
// Motors: 0 (no other motors) | Largest motor 25%: 0 (no motors in calc)
// Total: 2,850+12,000+8,520+0+0 = 23,370 VA
// Service: 23,370 ÷ 360 = 64.9 → 65A per 220.5(B) → 6 AWG Cu (65A) → 8 AWG GEC

export const RETAIL_STORE_VARIANTS: CommercialScenario[] = [
  {
    id: "retail-1",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 3000,
    voltage: 208,
    phases: 3,
    description: "A 3,000 sq ft retail store with 120/208V 3Ø service, show window displays, and a single HVAC unit",
    difficulty: "beginner",
    lampholders: 0,
    receptacles: 56,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 30,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 5, voltage: 208, phase: 3 },
    heatWatts: 10000,
    otherMotors: [],
  },
  {
    id: "retail-2",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 5000,
    voltage: 208,
    phases: 3,
    description: "A 5,000 sq ft retail store with 120/208V 3Ø service, large show windows, and an exhaust fan motor",
    difficulty: "intermediate",
    lampholders: 0,
    receptacles: 80,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 45,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 8000,
    otherMotors: [
      { name: "Exhaust Fan", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },
  {
    id: "retail-3",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 1500,
    voltage: 208,
    phases: 3,
    description: "A 1,500 sq ft boutique retail store with 120/208V 3Ø service and a compact show window",
    difficulty: "beginner",
    lampholders: 0,
    receptacles: 24,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 15,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 3, voltage: 208, phase: 3 },
    heatWatts: 12000,
    otherMotors: [],
  },
];
