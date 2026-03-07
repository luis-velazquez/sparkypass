// Commercial calculation steps following NEC Article 220 for non-dwelling occupancies
import type { CommercialCalculationStep } from "./types";
import {
  getMotorFLC,
  motorToVA,
  getMotorTableInfo,
  getServiceAmps,
  roundFractionalAmps,
  getFractionsOfAnAmpereRef,
  LIGHTING_LOAD_TABLE,
  getLightingLoadTableRef,
  LIGHTING_DEMAND_TABLE,
  applyLightingDemand,
  getLightingDemandTableRef,
  getReceptacleDemandTableRef,
  getKitchenDemandFactor,
  getKitchenEquipmentTableRef,
  getOutletLoadsRef,
  getTotalLoadRef,
  getMotorLoadRef,
  getHvacRef,
} from "../_shared/nec";
import {
  computeLargestMotor25,
  buildMotor25Prompt,
  buildMotor25Hint,
} from "../_shared/nec";
import { isAcMotorInCalc, getNonHvacMotorLoads, getMotorsInCalculation, toMotorsForCalc } from "./helpers";

export const COMMERCIAL_CALCULATION_STEPS: CommercialCalculationStep[] = [
  // Step 1: General Lighting Load — table ref is version-aware
  {
    id: "lighting-load",
    title: (v) => `General Lighting Load (${getLightingLoadTableRef(v)})`,
    sparkyPrompt: (_scenario, v = "2023") => {
      const ref = getLightingLoadTableRef(v);
      return `Let's start by calculating the general lighting load. Look up the VA per square foot for this building type in ${ref} and multiply by the square footage. Note: the 125% continuous load multiplier is already included in the table values per 210.20(A), so no additional multiplier is needed!`;
    },
    hint: (scenario, _prev, v = "2023") => {
      const ref = getLightingLoadTableRef(v);
      const rate = LIGHTING_LOAD_TABLE[scenario.buildingType]?.vaPerSqFt || 0;
      const total = Math.round(scenario.squareFootage * rate);
      return `Building type: ${LIGHTING_LOAD_TABLE[scenario.buildingType]?.label}\n${ref}: ${rate} VA/sq ft (125% already included)\n\n${scenario.squareFootage.toLocaleString()} sq ft × ${rate} VA/sq ft = ${total.toLocaleString()} VA`;
    },
    necReference: (v) => `NEC ${getLightingLoadTableRef(v)}`,
    inputType: "calculation",
    formula: (_scenario, v = "2023") => `Sq ft × VA/sq ft (from ${getLightingLoadTableRef(v)})`,
    expectedAnswer: (scenario) => {
      const rate = LIGHTING_LOAD_TABLE[scenario.buildingType]?.vaPerSqFt || 0;
      return Math.round(scenario.squareFootage * rate);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 2: Lighting Demand Factor — table ref is version-aware
  {
    id: "lighting-demand",
    title: (v) => `Lighting Demand Factor (${getLightingDemandTableRef(v)})`,
    sparkyPrompt: (_scenario, v = "2023") => {
      const ref = getLightingDemandTableRef(v);
      return `Now apply the demand factors from ${ref} for this building type. Different occupancies have different demand factors. Most commercial buildings use 100%, but warehouses and hotels have tiered reductions.`;
    },
    hint: (scenario, prev, v = "2023") => {
      const ref = getLightingDemandTableRef(v);
      const lightingVA = prev["lighting-load"] || 0;
      const entry = LIGHTING_DEMAND_TABLE[scenario.buildingType] || LIGHTING_DEMAND_TABLE["default"];

      if (scenario.buildingType === "warehouse") {
        if (lightingVA <= 12500) {
          return `${ref} (Warehouse):\nFirst 12,500 VA @ 100%\n\n${lightingVA.toLocaleString()} VA is under 12,500 → 100%\nDemand: ${lightingVA.toLocaleString()} VA`;
        }
        const first = 12500;
        const remainder = lightingVA - 12500;
        const demandRemainder = Math.round(remainder * 0.5);
        const total = first + demandRemainder;
        return `${ref} (Warehouse):\nFirst 12,500 VA @ 100% = 12,500 VA\nRemainder: ${remainder.toLocaleString()} VA @ 50% = ${demandRemainder.toLocaleString()} VA\n\nDemand: 12,500 + ${demandRemainder.toLocaleString()} = ${total.toLocaleString()} VA`;
      }

      return `${ref} (${entry.label}):\nDemand factor: 100%\n\n${lightingVA.toLocaleString()} VA × 100% = ${lightingVA.toLocaleString()} VA`;
    },
    necReference: (v) => `NEC ${getLightingDemandTableRef(v)}`,
    inputType: "calculation",
    formula: "Lighting VA × demand factor(s)",
    expectedAnswer: (scenario, prev) => {
      const lightingVA = prev["lighting-load"] || 0;
      return applyLightingDemand(lightingVA, scenario.buildingType);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 3: HVAC Load (220.60 / 120.60)
  {
    id: "hvac",
    title: (v) => `HVAC Load (${getHvacRef(v)})`,
    sparkyPrompt: (_scenario, v = "2023") => `Per ${getHvacRef(v)}, heating and cooling are non-coincident loads — use the LARGER of the two. For the A/C motor, convert HP to VA using the correct FLC table, then apply the 125% continuous load multiplier per 210.20(A). Compare the adjusted A/C VA to the heating load.`,
    hint: (scenario) => {
      if (scenario.acMotor) {
        const flc = getMotorFLC(scenario.acMotor);
        const acVA = motorToVA(scenario.acMotor);
        const acVA125 = Math.round(acVA * 1.25);
        const { tableNum, tableCol } = getMotorTableInfo(scenario.acMotor);
        const phaseLabel = scenario.acMotor.phase === 1 ? "single-phase" : "three-phase";

        let formula: string;
        if (scenario.acMotor.phase === 3) {
          formula = `${flc} × ${scenario.acMotor.voltage}V × 1.732 = ${acVA.toLocaleString()} VA`;
        } else {
          formula = `${flc} × ${scenario.acMotor.voltage}V = ${acVA.toLocaleString()} VA`;
        }

        let hint = `A/C Motor: ${scenario.acMotor.horsepower} HP, ${phaseLabel} @ ${scenario.acMotor.voltage}V\nTable ${tableNum} (${tableCol}): ${flc} Amps\n${formula}\n`;
        hint += `A/C @ 125%: ${acVA.toLocaleString()} × 1.25 = ${acVA125.toLocaleString()} VA\n\n`;
        hint += `Heating: ${scenario.heatWatts.toLocaleString()} W\n\n`;

        const larger = Math.max(acVA125, scenario.heatWatts);
        const largerName = scenario.heatWatts >= acVA125 ? "Heating" : "A/C @ 125%";
        hint += `${largerName} is larger: ${larger.toLocaleString()} VA`;
        return hint;
      }
      if (scenario.heatWatts > 0) {
        return `No A/C motor\nHeating: ${scenario.heatWatts.toLocaleString()} W\nUse heating: ${scenario.heatWatts.toLocaleString()} VA`;
      }
      return "No A/C or heating — enter 0.";
    },
    necReference: (v) => `NEC ${getHvacRef(v)}, 210.20(A), Table 430.248/430.250`,
    inputType: "calculation",
    formula: "Larger of: A/C (HP→VA × 125%) OR Heat",
    expectedAnswer: (scenario) => {
      let acVA = 0;
      if (scenario.acMotor) {
        acVA = Math.round(motorToVA(scenario.acMotor) * 1.25);
      }
      return Math.max(acVA, scenario.heatWatts);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 4: Other Loads (220.14 / 120.14) — merged with receptacle demand
  // Sub-step 0: Receptacle demand (handled in page.tsx via getOutletDemandSubStep)
  // Sub-step 1: Total other loads (receptacle demand + show windows + lampholders + sign)
  {
    id: "outlet-loads",
    title: (v) => `Other Loads (${getOutletLoadsRef(v)})`,
    sparkyPrompt: (scenario, v = "2023") => {
      const ref = getOutletLoadsRef(v);
      const demandRef = getReceptacleDemandTableRef(v);

      // Compute receptacle demand for display in the prompt
      const standardRecepts = (scenario.receptacles || 0) * 180;
      const multiOutlet = (scenario.multioutletAssemblyFeet || 0) * 180;
      const receptacleBaseLoad = standardRecepts + multiOutlet;
      let receptDemand = receptacleBaseLoad;
      if (receptacleBaseLoad > 10000) {
        receptDemand = 10000 + Math.round((receptacleBaseLoad - 10000) * 0.5);
      }

      const details: string[] = [];
      if (receptDemand > 0) details.push(`receptacle demand (${receptDemand.toLocaleString()} VA from ${demandRef})`);
      if (scenario.showWindowFeet > 0) details.push(`show window lighting at 200 VA/ft`);
      if (scenario.lampholders > 0) details.push(`heavy-duty lampholders at 600 VA each`);
      if (scenario.hasSignOutlet) details.push(`sign outlet at 1,200 VA per 600.5(A)`);

      if (details.length > 0) {
        details[0] = details[0].charAt(0).toUpperCase() + details[0].slice(1);
      }
      const joined = details.length <= 2
        ? details.join(" and ")
        : details.slice(0, -1).join(", ") + ", and " + details[details.length - 1];

      return `Now add together all the other loads: ${joined}. Per ${ref}, non-receptacle loads stay at 100%.`;
    },
    hint: (scenario) => {
      // Compute receptacle demand
      const standardRecepts = (scenario.receptacles || 0) * 180;
      const multiOutlet = (scenario.multioutletAssemblyFeet || 0) * 180;
      const receptacleBaseLoad = standardRecepts + multiOutlet;
      let receptDemand = receptacleBaseLoad;
      if (receptacleBaseLoad > 10000) {
        receptDemand = 10000 + Math.round((receptacleBaseLoad - 10000) * 0.5);
      }

      const parts: string[] = [];
      let total = 0;

      if (receptDemand > 0) {
        parts.push(`Receptacle Demand: ${receptDemand.toLocaleString()} VA`);
        total += receptDemand;
      }
      if (scenario.showWindowFeet > 0) {
        const val = scenario.showWindowFeet * 200;
        parts.push(`Show Window: ${scenario.showWindowFeet} ft × 200 VA = ${val.toLocaleString()} VA`);
        total += val;
      }
      if (scenario.lampholders > 0) {
        const val = scenario.lampholders * 600;
        parts.push(`Lampholders: ${scenario.lampholders} × 600 VA = ${val.toLocaleString()} VA`);
        total += val;
      }
      if (scenario.hasSignOutlet) {
        parts.push(`Sign Outlet: 1,200 VA`);
        total += 1200;
      }

      return parts.join("\n") + `\n\nTotal: ${total.toLocaleString()} VA`;
    },
    necReference: (v) => `NEC ${getOutletLoadsRef(v)}, ${getReceptacleDemandTableRef(v)}, 600.5(A)`,
    inputType: "calculation",
    formula: (scenario, v = "2023") => {
      const parts: string[] = [];
      const standardRecepts = (scenario.receptacles || 0) * 180;
      const multiOutlet = (scenario.multioutletAssemblyFeet || 0) * 180;
      if (standardRecepts + multiOutlet > 0) parts.push(`Recept Demand (${getReceptacleDemandTableRef(v)})`);
      if (scenario.showWindowFeet > 0) parts.push("(Show Window ft × 200)");
      if (scenario.lampholders > 0) parts.push("(Lampholders × 600)");
      if (scenario.hasSignOutlet) parts.push("Sign 1,200");
      return parts.join(" + ");
    },
    expectedAnswer: (scenario) => {
      // Receptacle demand
      const standardRecepts = (scenario.receptacles || 0) * 180;
      const multiOutlet = (scenario.multioutletAssemblyFeet || 0) * 180;
      const receptacleBaseLoad = standardRecepts + multiOutlet;
      let receptDemand = receptacleBaseLoad;
      if (receptacleBaseLoad > 10000) {
        receptDemand = 10000 + Math.round((receptacleBaseLoad - 10000) * 0.5);
      }

      // Non-receptacle loads at 100%
      const signVA = scenario.hasSignOutlet ? 1200 : 0;
      const showWindowVA = (scenario.showWindowFeet || 0) * 200;
      const lampholderVA = (scenario.lampholders || 0) * 600;

      return receptDemand + signVA + showWindowVA + lampholderVA;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 6: Kitchen Equipment — table ref is version-aware
  {
    id: "kitchen-demand",
    title: (v) => `Kitchen Equipment (${getKitchenEquipmentTableRef(v)})`,
    sparkyPrompt: (_scenario, v = "2023") => {
      const ref = getKitchenEquipmentTableRef(v);
      return `If this building has commercial kitchen equipment, calculate the demand load using ${ref}. Sum all equipment ratings, then apply the demand factor based on the number of pieces. If there's no kitchen equipment, enter 0.`;
    },
    hint: (scenario, _prev, v = "2023") => {
      const ref = getKitchenEquipmentTableRef(v);
      if (scenario.kitchenEquipment.length === 0) {
        return "No commercial kitchen equipment — enter 0.";
      }

      const count = scenario.kitchenEquipment.length;
      const sum = scenario.kitchenEquipment.reduce((s, item) => s + item.watts, 0);
      const factor = getKitchenDemandFactor(count);

      let hint = `Kitchen equipment (${count} items):\n`;
      scenario.kitchenEquipment.forEach(item => {
        hint += `• ${item.name}: ${item.watts.toLocaleString()} W\n`;
      });
      hint += `\nTotal: ${sum.toLocaleString()} W\n`;
      hint += `${ref}: ${count} units → ${Math.round(factor * 100)}% demand factor\n`;
      hint += `${sum.toLocaleString()} × ${Math.round(factor * 100)}% = ${Math.round(sum * factor).toLocaleString()} VA`;

      return hint;
    },
    necReference: (v) => `NEC ${getKitchenEquipmentTableRef(v)}`,
    inputType: "calculation",
    formula: (_scenario, v = "2023") => `Sum of equipment × demand factor (${getKitchenEquipmentTableRef(v)})`,
    expectedAnswer: (scenario) => {
      if (scenario.kitchenEquipment.length === 0) return 0;
      const sum = scenario.kitchenEquipment.reduce((s, item) => s + item.watts, 0);
      const factor = getKitchenDemandFactor(scenario.kitchenEquipment.length);
      return Math.round(sum * factor);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 7: Convert Non-HVAC Motors (HP to VA)
  // A/C motor is excluded here — it was already accounted for in the HVAC step.
  // When heating wins per HVAC rule, A/C is omitted entirely from the calculation.
  {
    id: "convert-motors",
    title: "Non-HVAC Motor Loads (HP to VA)",
    sparkyPrompt: (scenario, v = "2023") => {
      const motors = getNonHvacMotorLoads(scenario);
      if (motors.length === 0) {
        return "This building has no non-HVAC motors to convert. The A/C motor was already handled in the HVAC step. Enter 0.";
      }
      const heatWon = scenario.acMotor && !isAcMotorInCalc(scenario);
      let prompt = "Now let's convert the non-HVAC motors from HP to VA. Use Table 430.248 for single-phase motors and Table 430.250 for three-phase motors. Look up the FLC (Full-Load Current), then multiply by voltage (and × 1.732 for three-phase).";
      if (heatWon) {
        prompt += ` Note: the A/C motor was excluded by ${getHvacRef(v)} (heating was larger), so it's not included here.`;
      } else {
        prompt += " The A/C motor was already handled in the HVAC step, so it's not included here.";
      }
      prompt += " Enter the **total** VA of all non-HVAC motors.";
      return prompt;
    },
    hint: (scenario) => {
      const motors = getNonHvacMotorLoads(scenario);
      if (motors.length === 0) return "No non-HVAC motors — enter 0.";

      let hint = "Convert each non-HVAC motor:\n";
      motors.forEach(m => {
        const flc = getMotorFLC({ horsepower: m.hp, voltage: m.voltage, phase: m.phase });
        const { tableNum, tableCol } = getMotorTableInfo({ voltage: m.voltage, phase: m.phase });
        const phaseLabel = m.phase === 1 ? "1Ø" : "3Ø";
        hint += `\n• ${m.name}: ${m.hp} HP, ${phaseLabel} @ ${m.voltage}V\n`;
        hint += `  Table ${tableNum} (${tableCol}): ${flc} A\n`;
        if (m.phase === 3) {
          hint += `  ${flc} × ${m.voltage}V × 1.732 = ${m.va.toLocaleString()} VA\n`;
        } else {
          hint += `  ${flc} × ${m.voltage}V = ${m.va.toLocaleString()} VA\n`;
        }
      });

      const totalVA = motors.reduce((sum, m) => sum + m.va, 0);
      hint += `\nTotal non-HVAC motor VA: ${totalVA.toLocaleString()} VA`;

      return hint;
    },
    necReference: "NEC Table 430.248/430.250",
    inputType: "calculation",
    formula: "FLC (from table) × Voltage (× 1.732 for 3Ø) → enter total motor VA",
    expectedAnswer: (scenario) => {
      const motors = getNonHvacMotorLoads(scenario);
      if (motors.length === 0) return 0;
      return motors.reduce((sum, m) => sum + m.va, 0);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 8: Largest Motor +25% (220.50 / 120.50)
  // Uses shared largest-motor logic; A/C included when it won HVAC, excluded when heating won.
  {
    id: "largest-motor-25",
    title: (v) => `Largest Motor +25% (${getMotorLoadRef(v)})`,
    sparkyPrompt: (scenario, v = "2023") => {
      const hasAcMotor = !!scenario.acMotor;
      return buildMotor25Prompt(computeLargestMotor25(toMotorsForCalc(scenario), hasAcMotor), v);
    },
    hint: (scenario, _prev, v = "2023") => {
      const hasAcMotor = !!scenario.acMotor;
      return buildMotor25Hint(computeLargestMotor25(toMotorsForCalc(scenario), hasAcMotor), v);
    },
    necReference: (v) => `NEC ${getMotorLoadRef(v)}`,
    inputType: "calculation",
    formula: "Largest motor VA × 25%",
    expectedAnswer: (scenario) => {
      const motors = getMotorsInCalculation(scenario);
      if (motors.length === 0) return 0;
      const largestVA = Math.max(...motors.map(m => m.va));
      return Math.round(largestVA * 0.25);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 9: Total Calculated Load
  {
    id: "total-va",
    title: "Total Calculated Load",
    sparkyPrompt: (scenario) => {
      const hasMotorsInCalc = getMotorsInCalculation(scenario).length > 0;
      if (!hasMotorsInCalc) {
        return "Now add up all the demand loads: lighting, HVAC, receptacles, and kitchen equipment. Since the A/C was dropped as a noncoincident load and there are no other motors, you get a free pass on the 430.24 motor bump! What is your final total VA?";
      }
      return "Now add up all the demand loads: lighting demand, HVAC, receptacle demand, kitchen equipment demand, non-HVAC motor loads, and the 25% largest motor addition. What's the total VA?";
    },
    hint: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const otherLoads = prev["outlet-loads"] || 0;
      const kitchen = prev["kitchen-demand"] || 0;
      const motorLoads = prev["convert-motors"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;

      let hint = `Lighting Demand: ${lightingDemand.toLocaleString()} VA\n`;
      hint += `HVAC: ${hvac.toLocaleString()} VA\n`;
      hint += `Other Loads: ${otherLoads.toLocaleString()} VA\n`;
      hint += `Kitchen Equipment: ${kitchen.toLocaleString()} VA\n`;
      hint += `Motor Loads: ${motorLoads.toLocaleString()} VA\n`;
      hint += `Largest Motor 25%: ${motor25.toLocaleString()} VA\n`;

      const total = lightingDemand + hvac + otherLoads + kitchen + motorLoads + motor25;
      hint += `\nTotal: ${total.toLocaleString()} VA`;

      return hint;
    },
    necReference: (v) => `NEC ${getTotalLoadRef(v)}`,
    inputType: "calculation",
    formula: "Sum of all demand loads",
    expectedAnswer: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const otherLoads = prev["outlet-loads"] || 0;
      const kitchen = prev["kitchen-demand"] || 0;
      const motorLoads = prev["convert-motors"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;
      return lightingDemand + hvac + otherLoads + kitchen + motorLoads + motor25;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 500,
  },
  // Step 10: Service Amps
  {
    id: "service-conductor",
    title: "Service Amps",
    sparkyPrompt: (scenario, v = "2023") => {
      const ref = getFractionsOfAnAmpereRef(v);
      return `Final step! Calculate the service amperage by dividing total VA by the service voltage${scenario.phases === 3 ? " (voltage × 1.732 for three-phase)" : ""}. Round per ${ref}: 0.5 or greater rounds up.`;
    },
    hint: (scenario, prev, v = "2023") => {
      const ref = getFractionsOfAnAmpereRef(v);
      const totalVA = prev["total-va"] || 0;
      const rawAmps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      const roundedAmps = roundFractionalAmps(rawAmps);

      if (scenario.phases === 3) {
        return `${totalVA.toLocaleString()} VA ÷ (${scenario.voltage} × 1.732) = ${rawAmps.toFixed(1)}A\nPer ${ref}: ${rawAmps.toFixed(1)} → ${roundedAmps}A`;
      }
      return `${totalVA.toLocaleString()} VA ÷ ${scenario.voltage}V = ${rawAmps.toFixed(1)}A\nPer ${ref}: ${rawAmps.toFixed(1)} → ${roundedAmps}A`;
    },
    necReference: (v) => `NEC ${getFractionsOfAnAmpereRef(v)}`,
    inputType: "calculation",
    formula: (scenario, v = "2023") => scenario.phases === 3
      ? `Total VA ÷ (${scenario.voltage} × 1.732) → round per ${getFractionsOfAnAmpereRef(v)}`
      : `Total VA ÷ ${scenario.voltage}V → round per ${getFractionsOfAnAmpereRef(v)}`,
    expectedAnswer: (_scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = getServiceAmps(totalVA, _scenario.voltage, _scenario.phases);
      return roundFractionalAmps(amps);
    },
    validateAnswer: (user, expected) => user === expected,
  },
];
