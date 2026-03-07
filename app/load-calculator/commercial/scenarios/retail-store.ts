import type { CommercialScenario } from "../types";

// ─── Variant 1 (existing, beginner) — Heat wins, no other motors ─────────────
// A/C: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA → @125% = 7,520 VA
// Lighting: 3000×1.9 = 5,700 (100% demand) | Outlets: 56×180+30×200+1,200 = 17,280
// Receptacle demand: (17,280−1,200 sign)=16,080 → 10k@100%+6,080@50% = 13,040 + 1,200 sign = 14,240
// HVAC: max(7,520, 10,000) = 10,000 (heat wins, A/C excluded)
// Motors: 0 (no other motors) | Largest motor 25%: 0 (no motors in calc)
// Total: 5,700+10,000+14,240+0+0 = 29,940 VA
// Service: 29,940 ÷ 360 = 83.2 → 84A per 220.5(B) → 4 AWG Cu (85A) / 2 AWG Al (90A) → 8 AWG GEC

// ─── Variant 2 (beginner) — AC wins, has other motor, larger building ─────
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
    difficulty: "beginner",
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

  // ─── Variant 4 (intermediate) — Heat wins, multioutlet assembly, 1 motor ─────
  // A/C: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA → @125% = 7,520 VA
  // Exhaust: 1HP 3Ø@208V → 4.6A → 4.6×208×√3 = 1,657 VA
  // Lighting: 4000×1.9 = 7,600 (100% demand)
  // Outlets: 70×180+20×200+30×180+1,200 = 23,400
  //   (70 recepts=12,600) + (20 show window=4,000) + (30ft multioutlet=5,400) + (1,200 sign)
  // Receptacle demand: (23,400−1,200 sign)=22,200 → first 10k@100%+12,200@50% = 16,100 + 1,200 sign = 17,300
  // HVAC: max(7,520, 15,000) = 15,000 (heat wins, A/C excluded)
  // Motors: 1,657 | Largest motor 25%: 1,657×25% = 414
  // Total: 7,600+15,000+17,300+1,657+414 = 41,971 VA
  // Service: 41,971 ÷ 360 = 116.6 → 117A per 220.5(B) → 1 AWG Cu (130A) → 6 AWG GEC
  {
    id: "retail-4",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 4000,
    voltage: 208,
    phases: 3,
    description: "A 4,000 sq ft retail store with 120/208V 3Ø service, multioutlet assembly, show windows, and an exhaust fan",
    difficulty: "intermediate",
    lampholders: 0,
    receptacles: 70,
    multioutletAssemblyFeet: 30,
    showWindowFeet: 20,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 5, voltage: 208, phase: 3 },
    heatWatts: 15000,
    otherMotors: [
      { name: "Exhaust Fan", horsepower: 1, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 5 (intermediate) — AC wins, 2 motors, large show window ─────────
  // A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
  // Exhaust: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Loading Dock: 1HP 3Ø@208V → 4.6A → 4.6×208×√3 = 1,657 VA
  // Lighting: 6000×1.9 = 11,400 (100% demand)
  // Outlets: 100×180+50×200+1,200 = 29,200
  // Receptacle demand: (29,200−1,200 sign)=28,000 → first 10k@100%+18,000@50% = 19,000 + 1,200 sign = 20,200
  // HVAC: max(13,869, 6,000) = 13,869 (AC wins @125%)
  // Motors: 2,450+1,657 = 4,107 | Largest motor 25%: AC base 11,095 is largest → 11,095×25% = 2,774
  // Total: 11,400+13,869+20,200+4,107+2,774 = 52,350 VA
  // Service: 52,350 ÷ 360 = 145.4 → 146A per 220.5(B) → 1/0 Cu (150A) → 6 AWG GEC
  {
    id: "retail-5",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 6000,
    voltage: 208,
    phases: 3,
    description: "A 6,000 sq ft department store with 120/208V 3Ø service, large show windows, and two auxiliary motors",
    difficulty: "intermediate",
    lampholders: 0,
    receptacles: 100,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 50,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 6000,
    otherMotors: [
      { name: "Exhaust Fan", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Loading Dock Motor", horsepower: 1, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 6 (intermediate) — Heat wins, multioutlet + lampholders, 1 motor ─
  // A/C: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA → @125% = 10,898 VA
  // Ventilation Fan: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Lighting: 8000×1.9 = 15,200 (100% demand)
  // Lampholders: 12×180 = 2,160
  // Outlets: 140×180+35×200+20×180+2,160+1,200 = 35,360
  //   (140 recepts=25,200) + (35 show window=7,000) + (20ft multioutlet=3,600) + (2,160 lampholder) + (1,200 sign)
  // Receptacle demand: (35,360−1,200 sign)=34,160 → first 10k@100%+24,160@50% = 22,080 + 1,200 sign = 23,280
  // HVAC: max(10,898, 20,000) = 20,000 (heat wins, A/C excluded)
  // Motors: 2,378 | Largest motor 25%: 2,378×25% = 595
  // Total: 15,200+20,000+23,280+2,378+595 = 61,453 VA
  // Service: 61,453 ÷ 360 = 170.7 → 171A per 220.5(B) → 2/0 Cu (175A) → 4 AWG GEC
  {
    id: "retail-6",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 8000,
    voltage: 208,
    phases: 3,
    description: "An 8,000 sq ft retail warehouse store with 120/208V 3Ø service, multioutlet assembly, lampholders, and a ventilation fan",
    difficulty: "intermediate",
    lampholders: 12,
    receptacles: 140,
    multioutletAssemblyFeet: 20,
    showWindowFeet: 35,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 7.5, voltage: 208, phase: 3 },
    heatWatts: 20000,
    otherMotors: [
      { name: "Ventilation Fan", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 7 (expert) — AC wins, 2 motors, large store with multioutlet ────
  // A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
  // Exhaust Fan: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Loading Dock: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Lighting: 10,000×1.9 = 19,000 (100% demand)
  // Outlets: 160×180+45×200+25×180+1,200 = 43,500
  //   (160 recepts=28,800) + (45 show window=9,000) + (25ft multioutlet=4,500) + (1,200 sign)
  // Receptacle demand: (43,500−1,200 sign)=42,300 → first 10k@100%+32,300@50% = 26,150 + 1,200 sign = 27,350
  // HVAC: max(20,800, 12,000) = 20,800 (AC wins @125%)
  // Motors: 3,819+2,378 = 6,197 | Largest motor 25%: AC base 16,640 is largest → 16,640×25% = 4,160
  // Total: 19,000+20,800+27,350+6,197+4,160 = 77,507 VA
  // Service: 77,507 ÷ 360 = 215.3 → 216A per 220.5(B) → 4/0 Cu (230A) → 2 AWG GEC
  {
    id: "retail-7",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 10000,
    voltage: 208,
    phases: 3,
    description: "A 10,000 sq ft retail superstore with 120/208V 3Ø service, large show windows, multioutlet assembly, and two auxiliary motors",
    difficulty: "expert",
    lampholders: 0,
    receptacles: 160,
    multioutletAssemblyFeet: 25,
    showWindowFeet: 45,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 12000,
    otherMotors: [
      { name: "Exhaust Fan", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Loading Dock Motor", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 8 (expert) — Heat wins, 3 motors, lampholders, large multioutlet ─
  // A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
  // Exhaust Fan: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Loading Dock: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Ventilation Fan: 1HP 3Ø@208V → 4.6A → 4.6×208×√3 = 1,657 VA
  // Lighting: 12,000×1.9 = 22,800 (100% demand)
  // Lampholders: 15×180 = 2,700
  // Outlets: 200×180+55×200+35×180+2,700+1,200 = 57,200
  //   (200 recepts=36,000) + (55 show window=11,000) + (35ft multioutlet=6,300) + (2,700 lampholder) + (1,200 sign)
  // Receptacle demand: (57,200−1,200 sign)=56,000 → first 10k@100%+46,000@50% = 33,000 + 1,200 sign = 34,200
  // HVAC: max(20,800, 35,000) = 35,000 (heat wins, A/C excluded)
  // Motors: 2,450+2,378+1,657 = 6,485 | Largest motor 25%: 2,450×25% = 613
  // Total: 22,800+35,000+34,200+6,485+613 = 99,098 VA
  // Service: 99,098 ÷ 360 = 275.3 → 276A per 220.5(B) → 300 kcmil Cu (285A) → 2 AWG GEC
  {
    id: "retail-8",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 12000,
    voltage: 208,
    phases: 3,
    description: "A 12,000 sq ft retail megastore with 120/208V 3Ø service, extensive show windows, lampholders, multioutlet assembly, and three auxiliary motors",
    difficulty: "expert",
    lampholders: 15,
    receptacles: 200,
    multioutletAssemblyFeet: 35,
    showWindowFeet: 55,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 35000,
    otherMotors: [
      { name: "Exhaust Fan", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Loading Dock Motor", horsepower: 1.5, voltage: 208, phase: 3 },
      { name: "Ventilation Fan", horsepower: 1, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 9 (expert) — AC wins, 2 motors, very large store with lampholders ─
  // A/C: 20HP 3Ø@208V → 59.4A → 59.4×208×√3 = 21,403 VA → @125% = 26,754 VA
  // Exhaust Fan: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Loading Dock: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Lighting: 14,000×1.9 = 26,600 (100% demand)
  // Lampholders: 20×180 = 3,600
  // Outlets: 240×180+60×200+40×180+3,600+1,200 = 67,200
  //   (240 recepts=43,200) + (60 show window=12,000) + (40ft multioutlet=7,200) + (3,600 lampholder) + (1,200 sign)
  // Receptacle demand: (67,200−1,200 sign)=66,000 → first 10k@100%+56,000@50% = 38,000 + 1,200 sign = 39,200
  // HVAC: max(26,754, 18,000) = 26,754 (AC wins @125%)
  // Motors: 3,819+2,450 = 6,269 | Largest motor 25%: AC base 21,403 is largest → 21,403×25% = 5,351
  // Total: 26,600+26,754+39,200+6,269+5,351 = 104,174 VA
  // Service: 104,174 ÷ 360 = 289.4 → 290A per 220.5(B) → 350 kcmil Cu (310A) → 2 AWG GEC
  {
    id: "retail-9",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 14000,
    voltage: 208,
    phases: 3,
    description: "A 14,000 sq ft retail flagship store with 120/208V 3Ø service, extensive show windows, lampholders, multioutlet assembly, and two large auxiliary motors",
    difficulty: "expert",
    lampholders: 20,
    receptacles: 240,
    multioutletAssemblyFeet: 40,
    showWindowFeet: 60,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 20, voltage: 208, phase: 3 },
    heatWatts: 18000,
    otherMotors: [
      { name: "Exhaust Fan", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Loading Dock Motor", horsepower: 2, voltage: 208, phase: 3 },
    ],
  },
];
