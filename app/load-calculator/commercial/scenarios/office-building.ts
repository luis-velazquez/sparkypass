import type { CommercialScenario } from "../types";

// ─── Variant 1 (existing, beginner) — Heat wins, multioutlet, elevator motor ─
// A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
// Elevator: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA
// Lighting: 15000×1.3 = 19,500 (100% demand) | Outlets: 57,000
// Receptacle demand: (57,000−1,200 sign)=55,800 → demand 32,900 + 1,200 sign = 34,100
// HVAC: max(13,869, 40,000) = 40,000 (heat wins, A/C excluded)
// Motors: Elevator 8,718 | Largest motor 25%: 8,718×25% = 2,180 (only non-HVAC motors, heat won)
// Total: 19,500+40,000+34,100+0+8,718+2,180 = 104,498 VA
// Service: 104,498 ÷ 360 = 290.3 → 290A per 220.5(B) → 350 kcmil Cu (310A) / 500 kcmil Al (310A) → 2 AWG GEC

// ─── Variant 2 (beginner) — AC wins, smaller office, different motor ──────
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
    difficulty: "beginner",
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
    difficulty: "beginner",
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

  // ─── Variant 4 (intermediate) — Heat wins, large multioutlet, 2 motors ───────
  // A/C: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA → @125% = 13,869 VA
  // Elevator: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA
  // HVAC Supply Fan: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Lighting: 12000×1.3 = 15,600 (100% demand)
  // Outlets: 200×180+50×180+1,200 = 46,200
  //   (200 recepts=36,000) + (50ft multioutlet=9,000) + (1,200 sign)
  // Receptacle demand: (46,200−1,200 sign)=45,000 → first 10k@100%+35,000@50% = 27,500 + 1,200 sign = 28,700
  // HVAC: max(13,869, 45,000) = 45,000 (heat wins, A/C excluded)
  // Motors: 8,718+3,819 = 12,537
  // Largest motor 25%: 8,718×25% = 2,180 (only non-HVAC motors, heat won)
  // Total: 15,600+45,000+28,700+12,537+2,180 = 104,017 VA
  // Service: 104,017 ÷ 360 = 288.9 → 289A per 220.5(B) → 350 kcmil Cu (310A) → 2 AWG GEC
  {
    id: "office-4",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 12000,
    voltage: 208,
    phases: 3,
    description: "A 12,000 sq ft office building with 120/208V 3Ø service, multioutlet assemblies, elevator, and HVAC supply fan",
    difficulty: "intermediate",
    lampholders: 0,
    receptacles: 200,
    multioutletAssemblyFeet: 50,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 208, phase: 3 },
    heatWatts: 45000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 7.5, voltage: 208, phase: 3 },
      { name: "HVAC Supply Fan", horsepower: 3, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 5 (intermediate) — AC wins, large building, 3 motors ────────────
  // A/C: 20HP 3Ø@208V → 59.4A → 59.4×208×√3 = 21,403 VA → @125% = 26,754 VA
  // Elevator: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA
  // Exhaust Fan: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Sump Pump: 1HP 3Ø@208V → 4.6A → 4.6×208×√3 = 1,657 VA
  // Lighting: 20000×1.3 = 26,000 (100% demand)
  // Outlets: 300×180+60×180+1,200 = 66,000
  //   (300 recepts=54,000) + (60ft multioutlet=10,800) + (1,200 sign)
  // Receptacle demand: (66,000−1,200 sign)=64,800 → first 10k@100%+54,800@50% = 37,400 + 1,200 sign = 38,600
  // HVAC: max(26,754, 15,000) = 26,754 (AC wins @125%)
  // Motors: 11,095+2,450+1,657 = 15,202
  // Largest motor 25%: AC base 21,403 is largest → 21,403×25% = 5,351
  // Total: 26,000+26,754+38,600+15,202+5,351 = 111,907 VA
  // Service: 111,907 ÷ 360 = 310.9 → 311A per 220.5(B) → 400 kcmil Cu (335A) → 1/0 AWG GEC
  {
    id: "office-5",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 20000,
    voltage: 208,
    phases: 3,
    description: "A 20,000 sq ft multi-story office with 120/208V 3Ø service, multioutlet assemblies, passenger elevator, and three auxiliary motors",
    difficulty: "intermediate",
    lampholders: 0,
    receptacles: 300,
    multioutletAssemblyFeet: 60,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 20, voltage: 208, phase: 3 },
    heatWatts: 15000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 10, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 2, voltage: 208, phase: 3 },
      { name: "Sump Pump", horsepower: 1, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 6 (intermediate) — Heat wins, large building, 2 motors ──────────
  // A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
  // Elevator: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Parking Fan: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Lighting: 25000×1.3 = 32,500 (100% demand)
  // Outlets: 350×180+80×180+1,200 = 78,600
  //   (350 recepts=63,000) + (80ft multioutlet=14,400) + (1,200 sign)
  // Receptacle demand: (78,600−1,200 sign)=77,400 → first 10k@100%+67,400@50% = 43,700 + 1,200 sign = 44,900
  // HVAC: max(20,800, 60,000) = 60,000 (heat wins, A/C excluded)
  // Motors: 6,016+3,819 = 9,835
  // Largest motor 25%: 6,016×25% = 1,504 (only non-HVAC motors, heat won)
  // Total: 32,500+60,000+44,900+9,835+1,504 = 148,739 VA
  // Service: 148,739 ÷ 360 = 413.2 → 414A per 220.5(B) → 500 kcmil Cu (380A) → 1/0 AWG GEC
  // Note: 414A > 380A for 500 kcmil — need 600 kcmil Cu (420A) → 1/0 AWG GEC
  {
    id: "office-6",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 25000,
    voltage: 208,
    phases: 3,
    description: "A 25,000 sq ft corporate office with 120/208V 3Ø service, extensive multioutlet assemblies, elevator, and parking garage fan",
    difficulty: "intermediate",
    lampholders: 0,
    receptacles: 350,
    multioutletAssemblyFeet: 80,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 60000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Parking Garage Fan", horsepower: 3, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 7 (expert) — AC wins, 3 motors, very large multioutlet ───────────
  // A/C: 25HP 3Ø@208V → 74.8A → 74.8×208×√3 = 26,948 VA → @125% = 33,685 VA
  // Elevator: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA
  // HVAC Supply Fan: 5HP 3Ø@208V → 16.7A → 16.7×208×√3 = 6,016 VA
  // Sump Pump: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Lighting: 35,000×1.3 = 45,500 (100% demand)
  // Outlets: 400×180+100×180+1,200 = 91,200
  //   (400 recepts=72,000) + (100ft multioutlet=18,000) + (1,200 sign)
  // Receptacle demand: (91,200−1,200 sign)=90,000 → first 10k@100%+80,000@50% = 50,000 + 1,200 sign = 51,200
  // HVAC: max(33,685, 25,000) = 33,685 (AC wins @125%)
  // Motors: 11,095+6,016+2,378 = 19,489
  // Largest motor 25%: AC base 26,948 is largest → 26,948×25% = 6,737
  // Total: 45,500+33,685+51,200+19,489+6,737 = 156,611 VA
  // Service: 156,611 ÷ 360 = 435.0 → 435A per 220.5(B) → 600 kcmil Cu (420A)
  // Note: 435A > 420A for 600 kcmil — need 700 kcmil Cu (460A) → 2/0 AWG GEC
  {
    id: "office-7",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 35000,
    voltage: 208,
    phases: 3,
    description: "A 35,000 sq ft corporate tower with 120/208V 3Ø service, extensive multioutlet assemblies, passenger elevator, HVAC supply fan, and sump pump",
    difficulty: "expert",
    lampholders: 0,
    receptacles: 400,
    multioutletAssemblyFeet: 100,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 25, voltage: 208, phase: 3 },
    heatWatts: 25000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 10, voltage: 208, phase: 3 },
      { name: "HVAC Supply Fan", horsepower: 5, voltage: 208, phase: 3 },
      { name: "Sump Pump", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 8 (expert) — Heat wins, 3 motors, large building ─────────────────
  // A/C: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA → @125% = 20,800 VA
  // Elevator: 7.5HP 3Ø@208V → 24.2A → 24.2×208×√3 = 8,718 VA
  // HVAC Supply Fan: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Sump Pump: 1.5HP 3Ø@208V → 6.6A → 6.6×208×√3 = 2,378 VA
  // Lighting: 35,000×1.3 = 45,500 (100% demand)
  // Outlets: 380×180+80×180+1,200 = 84,000
  //   (380 recepts=68,400) + (80ft multioutlet=14,400) + (1,200 sign)
  // Receptacle demand: (84,000−1,200 sign)=82,800 → first 10k@100%+72,800@50% = 46,400 + 1,200 sign = 47,600
  // HVAC: max(20,800, 50,000) = 50,000 (heat wins, A/C excluded)
  // Motors: 8,718+3,819+2,378 = 14,915
  // Largest motor 25%: 8,718×25% = 2,180 (only non-HVAC motors, heat won)
  // Total: 45,500+50,000+47,600+14,915+2,180 = 160,195 VA
  // Service: 160,195 ÷ 360 = 445.0 → 445A per 220.5(B) → 600 kcmil Cu (420A)
  // Note: 445A > 420A for 600 kcmil — need 700 kcmil Cu (460A) → 2/0 AWG GEC
  {
    id: "office-8",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 35000,
    voltage: 208,
    phases: 3,
    description: "A 35,000 sq ft office complex with 120/208V 3Ø service, multioutlet assemblies, elevator, HVAC supply fan, sump pump, and large electric heating system",
    difficulty: "expert",
    lampholders: 0,
    receptacles: 380,
    multioutletAssemblyFeet: 80,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 15, voltage: 208, phase: 3 },
    heatWatts: 50000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 7.5, voltage: 208, phase: 3 },
      { name: "HVAC Supply Fan", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Sump Pump", horsepower: 1.5, voltage: 208, phase: 3 },
    ],
  },

  // ─── Variant 9 (expert) — AC wins, 4 motors, very large building ──────────────
  // A/C: 25HP 3Ø@208V → 74.8A → 74.8×208×√3 = 26,948 VA → @125% = 33,685 VA
  // Elevator #1: 15HP 3Ø@208V → 46.2A → 46.2×208×√3 = 16,640 VA
  // Elevator #2: 10HP 3Ø@208V → 30.8A → 30.8×208×√3 = 11,095 VA
  // Exhaust Fan: 3HP 3Ø@208V → 10.6A → 10.6×208×√3 = 3,819 VA
  // Sump Pump: 2HP 3Ø@208V → 6.8A → 6.8×208×√3 = 2,450 VA
  // Lighting: 45,000×1.3 = 58,500 (100% demand)
  // Outlets: 500×180+120×180+1,200 = 112,800
  //   (500 recepts=90,000) + (120ft multioutlet=21,600) + (1,200 sign)
  // Receptacle demand: (112,800−1,200 sign)=111,600 → first 10k@100%+101,600@50% = 60,800 + 1,200 sign = 62,000
  // HVAC: max(33,685, 20,000) = 33,685 (AC wins @125%)
  // Motors: 16,640+11,095+3,819+2,450 = 34,004
  // Largest motor 25%: AC base 26,948 is largest → 26,948×25% = 6,737
  // Total: 58,500+33,685+62,000+34,004+6,737 = 194,926 VA
  // Service: 194,926 ÷ 360 = 541.5 → 542A per 220.5(B) → 1000 kcmil Cu (545A) → 3/0 AWG GEC
  {
    id: "office-9",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 45000,
    voltage: 208,
    phases: 3,
    description: "A 45,000 sq ft multi-story office tower with 120/208V 3Ø service, extensive multioutlet assemblies, two passenger elevators, exhaust fan, and sump pump",
    difficulty: "expert",
    lampholders: 0,
    receptacles: 500,
    multioutletAssemblyFeet: 120,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 25, voltage: 208, phase: 3 },
    heatWatts: 20000,
    otherMotors: [
      { name: "Elevator Motor #1", horsepower: 15, voltage: 208, phase: 3 },
      { name: "Elevator Motor #2", horsepower: 10, voltage: 208, phase: 3 },
      { name: "Exhaust Fan", horsepower: 3, voltage: 208, phase: 3 },
      { name: "Sump Pump", horsepower: 2, voltage: 208, phase: 3 },
    ],
  },
];
