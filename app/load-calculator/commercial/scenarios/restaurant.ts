import type { CommercialScenario } from "../types";

// ─── Variant 1 (existing, beginner) — Heat wins, 6 kitchen items (65%), 2 motors ─
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

// ─── Variant 3 (beginner) — Heat wins, 5 kitchen items (70%), 2 motors (3Ø) ─
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
    difficulty: "beginner",
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
    difficulty: "beginner",
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

  // ─── Variant 4 (intermediate) — AC wins, 7 kitchen items (65%), 3 motors ─────
  // A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
  // Walk-in: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Exhaust: 2HP 1Ø@120V → 24A → 24×120 = 2,880 VA
  // Prep Hood: 1HP 3Ø@208V → 4.6A → 4.6×208×√3 = 1,657 VA
  // Lighting: 5000×1.5 = 7,500 (100% demand)
  // Lampholders: 20×180 = 3,600
  // Outlets: 55×180+20×180+3,600+1,200 = 18,300
  //   (55 recepts=9,900) + (20 lampholders=3,600) + (1,200 sign)
  // Receptacle demand: (18,300−1,200 sign)=17,100 → first 10k@100%+7,100@50% = 13,550 + 1,200 sign = 14,750
  // HVAC: max(20,800, 10,000) = 20,800 (AC wins @125%)
  // Kitchen: 42,000×65% = 27,300
  // Motors: 3,819+2,880+1,657 = 8,356
  // Largest motor 25%: AC base 16,640 is largest → 16,640×25% = 4,160
  // Total: 7,500+20,800+14,750+27,300+8,356+4,160 = 82,866 VA
  // Service: 82,866 ÷ 360 = 230.2 → 231A per 220.5(B) → 4/0 Cu (230A) → 2 AWG GEC
  // Note: 231A > 230A for 4/0 — need 250 kcmil Cu (255A) → 2 AWG GEC
  {
    id: "restaurant-4",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 5000,
    voltage: 208,
    phases: 3,
    description: "A 5,000 sq ft high-volume restaurant with 120/208V 3Ø service, large kitchen, walk-in cooler, and multiple motors",
    difficulty: "intermediate",
    lampholders: 20,
    receptacles: 55,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 12000 },
      { name: "Deep Fryer", watts: 8000 },
      { name: "Convection Oven", watts: 7000 },
      { name: "Dishwasher", watts: 5000 },
      { name: "Steam Table", watts: 4000 },
      { name: "Walk-in Freezer", watts: 3000 },
      { name: "Prep Warmer", watts: 3000 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 10000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 2, voltage: 120, phase: 1 },
      { name: "Prep Hood Fan", horsepower: 1, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 5 (intermediate) — Heat wins, 8 kitchen items (65%), 2 motors ───
  // A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
  // Walk-in: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Exhaust: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Lighting: 6000×1.5 = 9,000 (100% demand)
  // Lampholders: 15×180 = 2,700
  // Outlets: 65×180+15×180+2,700+1,200 = 18,300
  //   (65 recepts=11,700) + (15 lampholders=2,700) + (1,200 sign)
  // Receptacle demand: (18,300−1,200 sign)=17,100 → first 10k@100%+7,100@50% = 13,550 + 1,200 sign = 14,750
  // HVAC: max(13,869, 35,000) = 35,000 (heat wins, A/C excluded)
  // Kitchen: 48,000×65% = 31,200
  // Motors: 2,450+2,378 = 4,828
  // Largest motor 25%: 2,450×25% = 613 (only non-HVAC motors, heat won)
  // Total: 9,000+35,000+14,750+31,200+4,828+613 = 95,391 VA
  // Service: 95,391 ÷ 360 = 264.97 → 265A per 220.5(B) → 300 kcmil Cu (285A) → 2 AWG GEC
  {
    id: "restaurant-5",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 6000,
    voltage: 208,
    phases: 3,
    description: "A 6,000 sq ft banquet restaurant with 120/208V 3Ø service, extensive kitchen equipment, and electric heat",
    difficulty: "intermediate",
    lampholders: 15,
    receptacles: 65,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 12000 },
      { name: "Deep Fryer #1", watts: 7000 },
      { name: "Deep Fryer #2", watts: 5000 },
      { name: "Convection Oven", watts: 8000 },
      { name: "Dishwasher", watts: 5000 },
      { name: "Steam Table", watts: 4000 },
      { name: "Walk-in Freezer", watts: 4000 },
      { name: "Salamander Broiler", watts: 3000 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 35000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 6 (intermediate) — AC wins, 6 kitchen items (65%), 3 motors ─────
  // A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
  // Walk-in: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Exhaust: 1.5HP 1Ø@120V → 20A → 20×120 = 2,400 VA
  // Dough Mixer: 1HP 3Ø@208V → 4.6A → 4.6×208×√3 = 1,657 VA
  // Lighting: 7000×1.5 = 10,500 (100% demand)
  // Lampholders: 18×180 = 3,240
  // Outlets: 80×180+18×180+3,240+1,200 = 21,480
  //   (80 recepts=14,400) + (18 lampholders=3,240) + (1,200 sign)
  // Receptacle demand: (21,480−1,200 sign)=20,280 → first 10k@100%+10,280@50% = 15,140 + 1,200 sign = 16,340
  // HVAC: max(13,869, 8,000) = 13,869 (AC wins @125%)
  // Kitchen: 38,000×65% = 24,700
  // Motors: 3,819+2,400+1,657 = 7,876
  // Largest motor 25%: AC base 11,095 is largest → 11,095×25% = 2,774
  // Total: 10,500+13,869+16,340+24,700+7,876+2,774 = 76,059 VA
  // Service: 76,059 ÷ 360 = 211.3 → 212A per 220.5(B) → 4/0 Cu (230A) → 2 AWG GEC
  {
    id: "restaurant-6",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 7000,
    voltage: 208,
    phases: 3,
    description: "A 7,000 sq ft pizza restaurant with 120/208V 3Ø service, large kitchen, walk-in cooler, and a dough mixer",
    difficulty: "intermediate",
    lampholders: 18,
    receptacles: 80,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 10000 },
      { name: "Pizza Oven", watts: 9000 },
      { name: "Deep Fryer", watts: 6000 },
      { name: "Dishwasher", watts: 5000 },
      { name: "Walk-in Cooler", watts: 4000 },
      { name: "Prep Warmer", watts: 4000 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 8000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 1.5, voltage: 120, phase: 1 },
      { name: "Dough Mixer Motor", horsepower: 1, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 7 (expert) — AC wins, 9 kitchen items (65%), 3 motors ────────────
  // A/C: 20HP 3Ø@208V → 59.4A → 59.4×208×√3 = 21,403 VA → @125% = 26,754 VA
  // Walk-in: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Exhaust: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Prep Hood: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Lighting: 8,000×1.5 = 12,000 (100% demand)
  // Lampholders: 24×180 = 4,320
  // Outlets: 90×180+24×180+1,200 = 21,720
  //   (90 recepts=16,200) + (24 lampholders=4,320) + (1,200 sign)
  // Receptacle demand: (21,720−1,200 sign)=20,520 → first 10k@100%+10,520@50% = 15,260 + 1,200 sign = 16,460
  // HVAC: max(26,754, 15,000) = 26,754 (AC wins @125%)
  // Kitchen: 58,000×65% = 37,700
  // Motors: 6,016+2,450+2,378 = 10,844
  // Largest motor 25%: AC base 21,403 is largest → 21,403×25% = 5,351
  // Total: 12,000+26,754+16,460+37,700+10,844+5,351 = 109,109 VA
  // Service: 109,109 ÷ 360 = 303.1 → 304A per 220.5(B) → 350 kcmil Cu (310A) → 2 AWG GEC
  {
    id: "restaurant-7",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 8000,
    voltage: 208,
    phases: 3,
    description: "An 8,000 sq ft high-volume steakhouse with 120/208V 3Ø service, extensive kitchen, walk-in cooler, and multiple exhaust motors",
    difficulty: "expert",
    lampholders: 24,
    receptacles: 90,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 14000 },
      { name: "Deep Fryer #1", watts: 8000 },
      { name: "Deep Fryer #2", watts: 6000 },
      { name: "Convection Oven", watts: 9000 },
      { name: "Dishwasher", watts: 6000 },
      { name: "Steam Table", watts: 5000 },
      { name: "Walk-in Freezer", watts: 4000 },
      { name: "Salamander Broiler", watts: 3500 },
      { name: "Prep Warmer", watts: 2500 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 20, voltage: 208, phase: 3 },
    heatWatts: 15000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Prep Hood Fan", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 8 (expert) — Heat wins, 10 kitchen items (65%), 4 motors ─────────
  // A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
  // Walk-in: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Exhaust #1: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Exhaust #2: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Dough Mixer: 1HP 3Ø@208V → 4.6A → 4.6×208×√3 = 1,657 VA
  // Lighting: 10,000×1.5 = 15,000 (100% demand)
  // Lampholders: 30×180 = 5,400
  // Outlets: 110×180+30×180+1,200 = 26,400
  //   (110 recepts=19,800) + (30 lampholders=5,400) + (1,200 sign)
  // Receptacle demand: (26,400−1,200 sign)=25,200 → first 10k@100%+15,200@50% = 17,600 + 1,200 sign = 18,800
  // HVAC: max(20,800, 45,000) = 45,000 (heat wins, A/C excluded)
  // Kitchen: 68,000×65% = 44,200
  // Motors: 3,819+2,450+2,378+1,657 = 10,304
  // Largest motor 25%: 3,819×25% = 955 (only non-HVAC motors, heat won)
  // Total: 15,000+45,000+18,800+44,200+10,304+955 = 134,259 VA
  // Service: 134,259 ÷ 360 = 372.9 → 373A per 220.5(B) → 500 kcmil Cu (380A) → 1/0 AWG GEC
  {
    id: "restaurant-8",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 10000,
    voltage: 208,
    phases: 3,
    description: "A 10,000 sq ft banquet hall with 120/208V 3Ø service, full commercial kitchen, four auxiliary motors, and large electric heating system",
    difficulty: "expert",
    lampholders: 30,
    receptacles: 110,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 15000 },
      { name: "Deep Fryer #1", watts: 9000 },
      { name: "Deep Fryer #2", watts: 7000 },
      { name: "Convection Oven", watts: 8000 },
      { name: "Dishwasher", watts: 6000 },
      { name: "Steam Table", watts: 5000 },
      { name: "Walk-in Freezer", watts: 5000 },
      { name: "Salamander Broiler", watts: 4000 },
      { name: "Prep Warmer", watts: 3000 },
      { name: "Char Broiler", watts: 6000 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 45000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Exhaust Fan #1", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Exhaust Fan #2", horsepower: 1.5, voltage: 208, phase: 3 },
      { name: "Dough Mixer Motor", horsepower: 1, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 9 (expert) — AC wins, 8 kitchen items (65%), 3 motors, multioutlet
  // A/C: 25HP 3Ø@208V → 74.8A → 74.8×208×√3 = 26,948 VA → @125% = 33,685 VA
  // Walk-in: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Exhaust: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Prep Hood: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Lighting: 12,000×1.5 = 18,000 (100% demand)
  // Lampholders: 28×180 = 5,040
  // Outlets: 120×180+15×180+28×180+1,200 = 30,540
  //   (120 recepts=21,600) + (15ft multioutlet=2,700) + (28 lampholders=5,040) + (1,200 sign)
  // Receptacle demand: (30,540−1,200 sign)=29,340 → first 10k@100%+19,340@50% = 19,670 + 1,200 sign = 20,870
  // HVAC: max(33,685, 20,000) = 33,685 (AC wins @125%)
  // Kitchen: 70,000×65% = 45,500
  // Motors: 6,016+3,819+2,450 = 12,285
  // Largest motor 25%: AC base 26,948 is largest → 26,948×25% = 6,737
  // Total: 18,000+33,685+20,870+45,500+12,285+6,737 = 137,077 VA
  // Service: 137,077 ÷ 360 = 380.8 → 381A per 220.5(B) → 500 kcmil Cu (380A)
  // Note: 381A > 380A for 500 kcmil — need 600 kcmil Cu (420A) → 1/0 AWG GEC
  {
    id: "restaurant-9",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 12000,
    voltage: 208,
    phases: 3,
    description: "A 12,000 sq ft upscale event venue with 120/208V 3Ø service, large kitchen, multioutlet assembly, walk-in cooler, and powerful A/C system",
    difficulty: "expert",
    lampholders: 28,
    receptacles: 120,
    multioutletAssemblyFeet: 15,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 16000 },
      { name: "Pizza Oven", watts: 12000 },
      { name: "Deep Fryer", watts: 8000 },
      { name: "Convection Oven", watts: 10000 },
      { name: "Dishwasher", watts: 7000 },
      { name: "Steam Table", watts: 5000 },
      { name: "Walk-in Freezer", watts: 5000 },
      { name: "Char Broiler", watts: 7000 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 25, voltage: 208, phase: 3 },
    heatWatts: 20000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Prep Hood Fan", horsepower: 2, voltage: 208, phase: 3 },
    ],
  },
];
