import type { CommercialScenario } from "../types";

// ─── Variant 1 (existing, intermediate) — Heat wins, 6 kitchen items (65%), 2 motors ─
// A/C: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA → @125% = 10,898 VA
// Walk-in: 2HP 1Ø@208V → 12A → 12×208 = 2,496 VA
// Exhaust: 1HP 1Ø@120V → 16A → 16×120 = 1,920 VA
// Lighting: 4000×1.5 = 6,000 (100% demand) | Outlets: 14,400
// Receptacle demand: (14,400−1,200 sign)=13,200 → demand 11,600 + 1,200 sign = 12,800
// HVAC: max(10,898, 22,000) = 22,000 (heat wins, A/C excluded)
// Kitchen: 30,000×65% = 19,500 | Motors: 2,496+1,920 = 4,416
// Largest motor 25%: 2,496×25% = 624 (only non-HVAC motors, heat won)
// Total: 6,000+22,000+12,800+19,500+4,416+624 = 65,340 VA
// Service: 65,340 ÷ 360 = 181.5 → 182A per 220.5(B) → 3/0 Cu (200A) / 250 kcmil Al (205A) → 4 AWG GEC

// ─── Variant 2 (beginner) — AC wins, 4 kitchen items (80%), 1 other motor ────
// A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
// Exhaust: 1HP 1Ø@120V → 16A → 16×120 = 1,920 VA
// Lighting: 2500×1.5 = 3,750 (100% demand)
// Outlets: 30×180+1,200 sign = 6,600
// Receptacle demand: (6,600−1,200 sign)=5,400 → under 10kVA = 100% = 5,400 + 1,200 sign = 6,600
// HVAC: max(13,869, 8,000) = 13,869 (AC wins @125%)
// Kitchen: 17,500×80% = 14,000
// Motors: 1,920 | Largest motor 25%: AC base 11,095 is largest → 11,095×25% = 2,774
// Total: 3,750+13,869+6,600+14,000+1,920+2,774 = 42,913 VA
// Service: 42,913 ÷ 360 = 119.2 → 120A per 220.5(B) → 1 AWG Cu (130A) → 6 AWG GEC

// ─── Variant 3 (intermediate) — Heat wins, 5 kitchen items (70%), 2 motors (3Ø) ─
// A/C: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA → @125% = 10,898 VA
// Walk-in: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
// Exhaust: 1.5HP 1Ø@120V → 20A → 20×120 = 2,400 VA
// Lighting: 5000×1.5 = 7,500 (100% demand)
// Outlets: 50×180+15×180+1,200 = 12,900
// Receptacle demand: (12,900−1,200 sign)=11,700 → first 10k@100%+1,700@50% = 10,850 + 1,200 sign = 12,050
// HVAC: max(10,898, 30,000) = 30,000 (heat wins, A/C excluded)
// Kitchen: 32,000×70% = 22,400
// Motors: 3,819+2,400 = 6,219 | Largest motor 25%: 3,819×25% = 955
// Total: 7,500+30,000+12,050+22,400+6,219+955 = 79,124 VA
// Service: 79,124 ÷ 360 = 219.8 → 220A per 220.5(B) → 4/0 Cu (230A) / 300 kcmil Al (230A) → 2 AWG GEC

export const RESTAURANT_VARIANTS: CommercialScenario[] = [
  {
    id: "restaurant-1",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 4000,
    voltage: 208,
    phases: 3,
    description: "A 4,000 sq ft restaurant with 120/208V 3Ø service, full commercial kitchen, and multiple motors",
    difficulty: "intermediate",
    lampholders: 10,
    receptacles: 40,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 8000 },
      { name: "Deep Fryer", watts: 6000 },
      { name: "Convection Oven", watts: 5500 },
      { name: "Dishwasher", watts: 4500 },
      { name: "Steam Table", watts: 3500 },
      { name: "Reach-in Freezer", watts: 2500 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 7.5, voltage: 208, phase: 3 },
    heatWatts: 22000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 2, voltage: 208, phase: 1 },
      { name: "Exhaust Fan", horsepower: 1, voltage: 120, phase: 1 },
    ],
  },
  {
    id: "restaurant-2",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 2500,
    voltage: 208,
    phases: 3,
    description: "A 2,500 sq ft casual restaurant with 120/208V 3Ø service, compact kitchen, and rooftop A/C",
    difficulty: "beginner",
    lampholders: 6,
    receptacles: 30,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 7000 },
      { name: "Deep Fryer", watts: 5000 },
      { name: "Dishwasher", watts: 3500 },
      { name: "Reach-in Freezer", watts: 2000 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 8000,
    otherMotors: [
      { name: "Exhaust Fan", horsepower: 1, voltage: 120, phase: 1 },
    ],
  },
  {
    id: "restaurant-3",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 5000,
    voltage: 208,
    phases: 3,
    description: "A 5,000 sq ft upscale restaurant with 120/208V 3Ø service, large kitchen, and walk-in cooler",
    difficulty: "intermediate",
    lampholders: 15,
    receptacles: 50,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 10000 },
      { name: "Deep Fryer", watts: 7000 },
      { name: "Convection Oven", watts: 6000 },
      { name: "Dishwasher", watts: 5000 },
      { name: "Steam Table", watts: 4000 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 7.5, voltage: 208, phase: 3 },
    heatWatts: 30000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 1.5, voltage: 120, phase: 1 },
    ],
  },
];
