import type { CommercialScenario } from "../types";

// ─── Variant 1 (existing, beginner) — AC wins (0 heat), 2 other motors, tiered lighting ─
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

// ─── Variant 3 (beginner) — AC wins (0 heat), 3 other motors, large building ─
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
    difficulty: "beginner",
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
    difficulty: "beginner",
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

  // ─── Variant 4 (intermediate) — AC wins (0 heat), 3 motors, large building, tiered lighting ─
  // A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
  // Conveyor: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Dock Door: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Compactor: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Lighting: 25000×1.2 = 30,000 → demand 21,250 (warehouse: first 12,500@100%, 17,500@50%)
  // Lampholders: 30×180 = 5,400
  // Outlets: 25×180+30×180+5,400+1,200 = 16,500
  //   (25 recepts=4,500) + (30 lampholders=5,400) + (1,200 sign)
  // Receptacle demand: (16,500−1,200 sign)=15,300 → first 10k@100%+5,300@50% = 12,650 + 1,200 sign = 13,850
  // HVAC: max(13,869, 0) = 13,869 (AC wins @125%)
  // Motors: 6,016+3,819+2,450 = 12,285
  // Largest motor 25%: AC base 11,095 is largest → 11,095×25% = 2,774
  // Total: 21,250+13,869+13,850+12,285+2,774 = 64,028 VA
  // Service: 64,028 ÷ 360 = 177.9 → 178A per 220.5(B) → 2/0 Cu (175A) → 4 AWG GEC
  // Note: 178A > 175A for 2/0 — need 3/0 Cu (200A) → 4 AWG GEC
  {
    id: "warehouse-4",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 25000,
    voltage: 208,
    phases: 3,
    description: "A 25,000 sq ft distribution warehouse with 120/208V 3Ø service, conveyor system, dock doors, and a compactor",
    difficulty: "intermediate",
    lampholders: 30,
    receptacles: 25,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 0,
    otherMotors: [
      { name: "Conveyor Motor", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Dock Door Motor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Compactor Motor", horsepower: 2, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 5 (intermediate) — Heat wins, 4 motors, large tiered lighting ───
  // A/C: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA → @125% = 10,898 VA
  // Conveyor: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA
  // Dock Door: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Compactor: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Exhaust Fan: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Lighting: 30000×1.2 = 36,000 → demand 24,250 (warehouse: first 12,500@100%, 23,500@50%)
  // Lampholders: 40×180 = 7,200
  // Outlets: 30×180+40×180+7,200+1,200 = 20,400
  //   (30 recepts=5,400) + (40 lampholders=7,200) + (1,200 sign)
  // Receptacle demand: (20,400−1,200 sign)=19,200 → first 10k@100%+9,200@50% = 14,600 + 1,200 sign = 15,800
  // HVAC: max(10,898, 20,000) = 20,000 (heat wins, A/C excluded)
  // Motors: 8,718+2,450+3,819+2,378 = 17,365
  // Largest motor 25%: 8,718×25% = 2,180 (only non-HVAC motors, heat won)
  // Total: 24,250+20,000+15,800+17,365+2,180 = 79,595 VA
  // Service: 79,595 ÷ 360 = 221.1 → 222A per 220.5(B) → 4/0 Cu (230A) → 2 AWG GEC
  {
    id: "warehouse-5",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 30000,
    voltage: 208,
    phases: 3,
    description: "A 30,000 sq ft industrial warehouse with 120/208V 3Ø service, conveyor system, multiple dock motors, and electric heat",
    difficulty: "intermediate",
    lampholders: 40,
    receptacles: 30,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 7.5, voltage: 208, phase: 3 },
    heatWatts: 20000,
    otherMotors: [
      { name: "Conveyor Motor", horsepower: 7.5, voltage: 208, phase: 3 },
      { name: "Dock Door Motor", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Compactor Motor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 6 (intermediate) — AC wins (0 heat), 3 motors, multioutlet ──────
  // A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
  // Conveyor: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA
  // Dock Door: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Freight Elevator: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Lighting: 35000×1.2 = 42,000 → demand 27,250 (warehouse: first 12,500@100%, 29,500@50%)
  // Lampholders: 50×180 = 9,000
  // Outlets: 40×180+50×180+20×180+9,000+1,200 = 29,400
  //   (40 recepts=7,200) + (50 lampholders=9,000) + (20ft multioutlet=3,600) + (1,200 sign)
  // Receptacle demand: (29,400−1,200 sign)=28,200 → first 10k@100%+18,200@50% = 19,100 + 1,200 sign = 20,300
  // HVAC: max(20,800, 0) = 20,800 (AC wins @125%)
  // Motors: 11,095+3,819+6,016 = 20,930
  // Largest motor 25%: AC base 16,640 is largest → 16,640×25% = 4,160
  // Total: 27,250+20,800+20,300+20,930+4,160 = 93,440 VA
  // Service: 93,440 ÷ 360 = 259.6 → 260A per 220.5(B) → 300 kcmil Cu (285A) → 2 AWG GEC
  {
    id: "warehouse-6",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 35000,
    voltage: 208,
    phases: 3,
    description: "A 35,000 sq ft fulfillment center with 120/208V 3Ø service, conveyor line, freight elevator, multioutlet assembly, and dock motors",
    difficulty: "intermediate",
    lampholders: 50,
    receptacles: 40,
    multioutletAssemblyFeet: 20,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 0,
    otherMotors: [
      { name: "Conveyor Motor", horsepower: 10, voltage: 208, phase: 3 },
      { name: "Dock Door Motor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Freight Elevator", horsepower: 5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 7 (expert) — AC wins (0 heat), 5 motors, multioutlet, tiered lighting
  // A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
  // Conveyor: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA
  // Dock Door #1: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Dock Door #2: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Compactor: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Exhaust Fan: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Lighting: 45,000×1.2 = 54,000 → demand 33,250 (warehouse: first 12,500@100%, 41,500@50%)
  // Lampholders: 50×180 = 9,000
  // Outlets: 70×180+50×180+25×180+1,200 = 27,300
  //   (70 recepts=12,600) + (50 lampholders=9,000) + (25ft multioutlet=4,500) + (1,200 sign)
  // Receptacle demand: (27,300−1,200 sign)=26,100 → first 10k@100%+16,100@50% = 18,050 + 1,200 sign = 19,250
  // HVAC: max(20,800, 0) = 20,800 (AC wins @125%)
  // Motors: 11,095+3,819+2,450+6,016+2,378 = 25,758
  // Largest motor 25%: AC base 16,640 is largest → 16,640×25% = 4,160
  // Total: 33,250+20,800+19,250+25,758+4,160 = 103,218 VA
  // Service: 103,218 ÷ 360 = 286.7 → 287A per 220.5(B) → 300 kcmil Cu (285A)
  // Note: 287A > 285A for 300 kcmil — need 350 kcmil Cu (310A) → 2 AWG GEC
  {
    id: "warehouse-7",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 45000,
    voltage: 208,
    phases: 3,
    description: "A 45,000 sq ft distribution center with 120/208V 3Ø service, conveyor system, dual dock doors, compactor, exhaust fan, and multioutlet assembly",
    difficulty: "expert",
    lampholders: 50,
    receptacles: 70,
    multioutletAssemblyFeet: 25,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 0,
    otherMotors: [
      { name: "Conveyor Motor", horsepower: 10, voltage: 208, phase: 3 },
      { name: "Dock Door Motor #1", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Dock Door Motor #2", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Compactor Motor", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 8 (expert) — Heat wins, 4 motors, multioutlet, tiered lighting ───
  // A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
  // Conveyor: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA
  // Dock Door: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Freight Elevator: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Compactor: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Lighting: 50,000×1.2 = 60,000 → demand 36,250 (warehouse: first 12,500@100%, 47,500@50%)
  // Lampholders: 60×180 = 10,800
  // Outlets: 80×180+60×180+30×180+1,200 = 31,800
  //   (80 recepts=14,400) + (60 lampholders=10,800) + (30ft multioutlet=5,400) + (1,200 sign)
  // Receptacle demand: (31,800−1,200 sign)=30,600 → first 10k@100%+20,600@50% = 20,300 + 1,200 sign = 21,500
  // HVAC: max(13,869, 25,000) = 25,000 (heat wins, A/C excluded)
  // Motors: 8,718+3,819+6,016+3,819 = 22,372
  // Largest motor 25%: 8,718×25% = 2,180 (only non-HVAC motors, heat won)
  // Total: 36,250+25,000+21,500+22,372+2,180 = 107,302 VA
  // Service: 107,302 ÷ 360 = 298.1 → 298A per 220.5(B) → 300 kcmil Cu (285A)
  // Note: 298A > 285A for 300 kcmil — need 350 kcmil Cu (310A) → 2 AWG GEC
  {
    id: "warehouse-8",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 50000,
    voltage: 208,
    phases: 3,
    description: "A 50,000 sq ft industrial warehouse with 120/208V 3Ø service, conveyor line, freight elevator, dock door, compactor, multioutlet assembly, and electric heat",
    difficulty: "expert",
    lampholders: 60,
    receptacles: 80,
    multioutletAssemblyFeet: 30,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 25000,
    otherMotors: [
      { name: "Conveyor Motor", horsepower: 7.5, voltage: 208, phase: 3 },
      { name: "Dock Door Motor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Freight Elevator", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Compactor Motor", horsepower: 3, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 9 (expert) — AC wins (0 heat), 6 motors, multioutlet, tiered lighting
  // A/C: 20HP 3Ø@208V → 59.4A → 59.4×208×√3 = 21,403 VA → @125% = 26,754 VA
  // Conveyor #1: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA
  // Conveyor #2: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA
  // Dock Door: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Freight Elevator: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA
  // Compactor: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Exhaust Fan: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Lighting: 60,000×1.2 = 72,000 → demand 42,250 (warehouse: first 12,500@100%, 59,500@50%)
  // Lampholders: 80×180 = 14,400
  // Outlets: 100×180+80×180+40×180+1,200 = 40,800
  //   (100 recepts=18,000) + (80 lampholders=14,400) + (40ft multioutlet=7,200) + (1,200 sign)
  // Receptacle demand: (40,800−1,200 sign)=39,600 → first 10k@100%+29,600@50% = 24,800 + 1,200 sign = 26,000
  // HVAC: max(26,754, 0) = 26,754 (AC wins @125%)
  // Motors: 11,095+8,718+3,819+11,095+6,016+2,450 = 43,193
  // Largest motor 25%: AC base 21,403 is largest → 21,403×25% = 5,351
  // Total: 42,250+26,754+26,000+43,193+5,351 = 143,548 VA
  // Service: 143,548 ÷ 360 = 398.7 → 399A per 220.5(B) → 500 kcmil Cu (380A)
  // Note: 399A > 380A for 500 kcmil — need 600 kcmil Cu (420A) → 1/0 AWG GEC
  {
    id: "warehouse-9",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 60000,
    voltage: 208,
    phases: 3,
    description: "A 60,000 sq ft mega warehouse with 120/208V 3Ø service, dual conveyor lines, freight elevator, dock door, compactor, exhaust fan, and multioutlet assembly",
    difficulty: "expert",
    lampholders: 80,
    receptacles: 100,
    multioutletAssemblyFeet: 40,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 20, voltage: 208, phase: 3 },
    heatWatts: 0,
    otherMotors: [
      { name: "Conveyor Motor #1", horsepower: 10, voltage: 208, phase: 3 },
      { name: "Conveyor Motor #2", horsepower: 7.5, voltage: 208, phase: 3 },
      { name: "Dock Door Motor", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Freight Elevator", horsepower: 10, voltage: 208, phase: 3 },
      { name: "Compactor Motor", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 2, voltage: 208, phase: 3 },
    ],
  },
];
