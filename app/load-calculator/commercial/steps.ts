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
  applyReceptacleDemand,
  getReceptacleDemandTableRef,
  getKitchenDemandFactor,
  getKitchenEquipmentTableRef,
  CONDUCTOR_TABLE,
  getConductorSize,
  getAluminumConductorSize,
  getGECSize,
  getOutletLoadsRef,
  getTotalLoadRef,
  getMotorLoadRef,
  getHvacRef,
} from "../_shared/nec";
import { isAcMotorInCalc, getNonHvacMotorLoads, getMotorsInCalculation } from "./helpers";

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
          formula = `${flc} × ${scenario.acMotor.voltage}V × √3 = ${acVA.toLocaleString()} VA`;
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
  // Step 4: Outlet Loads (220.14 / 120.14)
  {
    id: "outlet-loads",
    title: (v) => `Outlet Loads (${getOutletLoadsRef(v)})`,
    sparkyPrompt: (scenario, v = "2023") => {
      const details: string[] = [];
      if (scenario.lampholders > 0) details.push("heavy-duty lampholders are 600 VA each");
      if (scenario.receptacles > 0) details.push("receptacle outlets are 180 VA each");
      if (scenario.multioutletAssemblyFeet > 0) details.push("multioutlet assemblies are 180 VA per foot");
      if (scenario.showWindowFeet > 0) details.push("show window lighting is 200 VA per linear foot");
      if (scenario.hasSignOutlet) details.push("each required sign outlet is 1,200 VA per 600.5(A)");
      // Capitalize first item and join with commas + "and"
      if (details.length > 0) {
        details[0] = details[0].charAt(0).toUpperCase() + details[0].slice(1);
      }
      const joined = details.length <= 2
        ? details.join(" and ")
        : details.slice(0, -1).join(", ") + ", and " + details[details.length - 1];
      return `Calculate the total outlet loads. Per ${getOutletLoadsRef(v)}: ${joined}.`;
    },
    hint: (scenario) => {
      const parts: string[] = [];
      let total = 0;

      if (scenario.lampholders > 0) {
        const val = scenario.lampholders * 600;
        parts.push(`Lampholders: ${scenario.lampholders} × 600 VA = ${val.toLocaleString()} VA`);
        total += val;
      }
      if (scenario.receptacles > 0) {
        const recept = scenario.receptacles * 180;
        parts.push(`Receptacles: ${scenario.receptacles} × 180 VA = ${recept.toLocaleString()} VA`);
        total += recept;
      }
      if (scenario.multioutletAssemblyFeet > 0) {
        const val = scenario.multioutletAssemblyFeet * 180;
        parts.push(`Multioutlet Assembly: ${scenario.multioutletAssemblyFeet} ft × 180 VA = ${val.toLocaleString()} VA`);
        total += val;
      }
      if (scenario.showWindowFeet > 0) {
        const val = scenario.showWindowFeet * 200;
        parts.push(`Show Window: ${scenario.showWindowFeet} ft × 200 VA = ${val.toLocaleString()} VA`);
        total += val;
      }
      if (scenario.hasSignOutlet) {
        parts.push(`Sign Outlet: 1,200 VA`);
        total += 1200;
      }

      return parts.join("\n") + `\n\nTotal: ${total.toLocaleString()} VA`;
    },
    necReference: (v) => `NEC ${getOutletLoadsRef(v)}, 600.5(A)`,
    inputType: "calculation",
    formula: (scenario) => {
      const parts: string[] = [];
      if (scenario.lampholders > 0) parts.push("Lampholders×600");
      if (scenario.receptacles > 0) parts.push("Recepts×180");
      if (scenario.multioutletAssemblyFeet > 0) parts.push("Multioutlet ft×180");
      if (scenario.showWindowFeet > 0) parts.push("Show Window ft×200");
      if (scenario.hasSignOutlet) parts.push("Sign 1,200");
      return parts.join(" + ");
    },
    expectedAnswer: (scenario) => {
      let total = 0;
      if (scenario.lampholders > 0) total += scenario.lampholders * 600;
      if (scenario.receptacles > 0) total += scenario.receptacles * 180;
      if (scenario.multioutletAssemblyFeet > 0) total += scenario.multioutletAssemblyFeet * 180;
      if (scenario.showWindowFeet > 0) total += scenario.showWindowFeet * 200;
      if (scenario.hasSignOutlet) total += 1200;
      return total;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 5: Receptacle Demand Factor — table ref is version-aware
  // Per 220.14(F)/600.5(A), sign outlet (1,200 VA) is NOT a receptacle load.
  // Apply demand only to receptacle-type loads, then add sign at 100%.
  {
    id: "receptacle-demand",
    title: (v) => `Receptacle Demand Factor (${getReceptacleDemandTableRef(v)})`,
    sparkyPrompt: (scenario, v = "2023") => {
      const ref = getReceptacleDemandTableRef(v);
      if (scenario.hasSignOutlet) {
        return `Apply the demand factors from ${ref}, but note: the sign outlet is required per 600.5(A) and calculated under ${getOutletLoadsRef(v)}(F). Because it is NOT a standard receptacle load, it stays at 100% and is not subject to ${ref} demand. Subtract the sign outlet first, apply the demand factor to the remaining receptacle-type loads, then add the sign outlet back at full value.`;
      }
      return `Apply the demand factors from ${ref} to the total outlet load. The first 10 kVA is at 100%, and the remainder is at 50%. If the total is under 10 kVA, use 100%.`;
    },
    hint: (scenario, prev) => {
      const outletTotal = prev["outlet-loads"] || 0;
      const signVA = scenario.hasSignOutlet ? 1200 : 0;
      const receptacleLoads = outletTotal - signVA;
      const receptDemand = applyReceptacleDemand(receptacleLoads);

      if (scenario.hasSignOutlet) {
        let hint = `Total outlet load: ${outletTotal.toLocaleString()} VA\n`;
        hint += `Sign outlet (600.5(A)): −${signVA.toLocaleString()} VA (not a receptacle)\n`;
        hint += `Receptacle loads: ${receptacleLoads.toLocaleString()} VA\n\n`;

        if (receptacleLoads <= 10000) {
          hint += `Under 10 kVA → 100%\nReceptacle demand: ${receptacleLoads.toLocaleString()} VA\n`;
        } else {
          const remainder = receptacleLoads - 10000;
          const demandRemainder = Math.round(remainder * 0.5);
          hint += `First 10,000 VA @ 100% = 10,000 VA\n`;
          hint += `Remainder: ${remainder.toLocaleString()} VA @ 50% = ${demandRemainder.toLocaleString()} VA\n`;
          hint += `Receptacle demand: 10,000 + ${demandRemainder.toLocaleString()} = ${receptDemand.toLocaleString()} VA\n`;
        }

        const total = receptDemand + signVA;
        hint += `\nAdd sign back: ${receptDemand.toLocaleString()} + ${signVA.toLocaleString()} = ${total.toLocaleString()} VA`;
        return hint;
      }

      if (outletTotal <= 10000) {
        return `Total outlet load: ${outletTotal.toLocaleString()} VA\n\nUnder 10 kVA → 100%\nDemand: ${outletTotal.toLocaleString()} VA`;
      }

      const remainder = outletTotal - 10000;
      const demandRemainder = Math.round(remainder * 0.5);
      const total = 10000 + demandRemainder;
      return `Total outlet load: ${outletTotal.toLocaleString()} VA\n\nFirst 10,000 VA @ 100% = 10,000 VA\nRemainder: ${remainder.toLocaleString()} VA @ 50% = ${demandRemainder.toLocaleString()} VA\n\nDemand: 10,000 + ${demandRemainder.toLocaleString()} = ${total.toLocaleString()} VA`;
    },
    necReference: (v) => `NEC ${getReceptacleDemandTableRef(v)}, 600.5(A)`,
    inputType: "calculation",
    formula: (_scenario, v = "2023") => `Subtract sign outlet, apply ${getReceptacleDemandTableRef(v)} to remainder, add sign back`,
    expectedAnswer: (scenario, prev) => {
      const outletTotal = prev["outlet-loads"] || 0;
      const signVA = scenario.hasSignOutlet ? 1200 : 0;
      return applyReceptacleDemand(outletTotal - signVA) + signVA;
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
      let prompt = "Now let's convert the non-HVAC motors from HP to VA. Use Table 430.248 for single-phase motors and Table 430.250 for three-phase motors. Look up the FLC (Full-Load Current), then multiply by voltage (and × √3 for three-phase).";
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
          hint += `  ${flc} × ${m.voltage}V × √3 = ${m.va.toLocaleString()} VA\n`;
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
    formula: "FLC (from table) × Voltage (× √3 for 3Ø) → enter total motor VA",
    expectedAnswer: (scenario) => {
      const motors = getNonHvacMotorLoads(scenario);
      if (motors.length === 0) return 0;
      return motors.reduce((sum, m) => sum + m.va, 0);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 8: Largest Motor +25% (220.50 / 120.50)
  // Uses getMotorsInCalculation() which includes A/C when it won the HVAC comparison,
  // and excludes it when heating won.
  {
    id: "largest-motor-25",
    title: (v) => `Largest Motor +25% (${getMotorLoadRef(v)})`,
    sparkyPrompt: (scenario, v = "2023") => {
      const motors = getMotorsInCalculation(scenario);
      if (motors.length === 0) {
        return "There are no motors in this calculation. Enter 0.";
      }
      let prompt = `Per ${getMotorLoadRef(v)} and 430.24, add 25% of the largest motor's VA load to the service calculation. Consider all motors whose loads are included in our total.`;
      if (scenario.acMotor && isAcMotorInCalc(scenario)) {
        prompt += ` Remember: the A/C motor (from the HVAC step) won ${getHvacRef(v)}, so its load IS in the calculation — include it when finding the largest motor.`;
      }
      return prompt;
    },
    hint: (scenario) => {
      const motors = getMotorsInCalculation(scenario);
      if (motors.length === 0) return "No motors in the calculation — enter 0.";

      let hint = "Motors in the calculation:\n";
      motors.forEach(m => {
        const note = (scenario.acMotor && m.name === scenario.acMotor.name && isAcMotorInCalc(scenario))
          ? " (from HVAC step)"
          : "";
        hint += `• ${m.name}${note}: ${m.va.toLocaleString()} VA\n`;
      });

      const largest = motors.reduce((max, m) => m.va > max.va ? m : max);
      const addition = Math.round(largest.va * 0.25);
      hint += `\nLargest: ${largest.name} at ${largest.va.toLocaleString()} VA\n`;
      hint += `25% of ${largest.va.toLocaleString()} = ${addition.toLocaleString()} VA`;

      return hint;
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
      const receptDemand = prev["receptacle-demand"] || 0;
      const kitchen = prev["kitchen-demand"] || 0;
      const motorLoads = prev["convert-motors"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;

      let hint = `Lighting Demand: ${lightingDemand.toLocaleString()} VA\n`;
      hint += `HVAC: ${hvac.toLocaleString()} VA\n`;
      hint += `Receptacle Demand: ${receptDemand.toLocaleString()} VA\n`;
      hint += `Kitchen Equipment: ${kitchen.toLocaleString()} VA\n`;
      hint += `Motor Loads: ${motorLoads.toLocaleString()} VA\n`;
      hint += `Largest Motor 25%: ${motor25.toLocaleString()} VA\n`;

      const total = lightingDemand + hvac + receptDemand + kitchen + motorLoads + motor25;
      hint += `\nTotal: ${total.toLocaleString()} VA`;

      return hint;
    },
    necReference: (v) => `NEC ${getTotalLoadRef(v)}`,
    inputType: "calculation",
    formula: "Sum of all demand loads",
    expectedAnswer: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const receptDemand = prev["receptacle-demand"] || 0;
      const kitchen = prev["kitchen-demand"] || 0;
      const motorLoads = prev["convert-motors"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;
      return lightingDemand + hvac + receptDemand + kitchen + motorLoads + motor25;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 500,
  },
  // Step 10: Service Conductor Sizing (Table 310.16)
  {
    id: "service-conductor",
    title: "Service Conductor (Table 310.16)",
    sparkyPrompt: (_scenario, v = "2023") => {
      const ref = getFractionsOfAnAmpereRef(v);
      return `Divide the total VA by the service voltage to get the minimum ampacity. For three-phase 208V, use 360 as the divisor per NEC Annex D. Round per ${ref}: if the decimal is 0.5 or greater, round up to the next whole number. Then look up the conductor size in Table 310.16 (75°C copper column). Enter the ampacity rating from the table.`;
    },
    hint: (scenario, prev, v = "2023") => {
      const ref = getFractionsOfAnAmpereRef(v);
      const totalVA = prev["total-va"] || 0;
      const rawAmps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      const roundedAmps = roundFractionalAmps(rawAmps);
      const conductor = getConductorSize(roundedAmps);
      const aluminumConductor = getAluminumConductorSize(roundedAmps);

      let formula: string;
      if (scenario.phases === 3) {
        const divisor = scenario.voltage === 208 ? 360 : Math.round(scenario.voltage * Math.sqrt(3) * 10) / 10;
        formula = `${totalVA.toLocaleString()} VA ÷ ${divisor} = ${rawAmps.toFixed(1)} → ${roundedAmps}A per ${ref}`;
      } else {
        formula = `${totalVA.toLocaleString()} VA ÷ ${scenario.voltage}V = ${rawAmps.toFixed(1)} → ${roundedAmps}A per ${ref}`;
      }

      let result = `${formula}\n\nTable 310.16 — 75°C Cu:\nMinimum conductor: ${conductor.size} AWG/kcmil\nAmpacity: ${conductor.ampacity}A`;
      if (aluminumConductor) {
        result += `\n\nTable 310.16 — 75°C Al:\nMinimum conductor: ${aluminumConductor.size} AWG/kcmil\nAmpacity: ${aluminumConductor.aluminumAmpacity}A`;
      }
      result += `\n\nEnter the copper ampacity: ${conductor.ampacity}`;
      return result;
    },
    necReference: (v) => `NEC ${getFractionsOfAnAmpereRef(v)}, Table 310.16`,
    inputType: "calculation",
    formula: (_scenario, v = "2023") => `Total VA ÷ 360 (208V 3Ø) → round per ${getFractionsOfAnAmpereRef(v)} → Table 310.16`,
    expectedAnswer: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      return getConductorSize(amps).ampacity;
    },
    validateAnswer: (user, expected) => {
      // Accept the exact ampacity from the table
      const validAmpacities = CONDUCTOR_TABLE.map(c => c.ampacity);
      return validAmpacities.includes(user) && user >= expected;
    },
  },
  // Step 11: GEC Sizing (Table 250.66)
  {
    id: "gec-size",
    title: "GEC Sizing (Table 250.66)",
    sparkyPrompt: "Finally, size the Grounding Electrode Conductor (GEC) using Table 250.66. Look up the service conductor size from the previous step and find the required GEC size. Enter the GEC AWG number (use 10 for 1/0, 20 for 2/0, 30 for 3/0).",
    hint: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      const conductor = getConductorSize(amps);
      const gecSize = getGECSize(conductor.size);

      let gecDisplay = gecSize;
      let gecEntry = gecSize;
      if (gecSize === "1/0") { gecEntry = "10"; gecDisplay = "1/0 (enter 10)"; }
      else if (gecSize === "2/0") { gecEntry = "20"; gecDisplay = "2/0 (enter 20)"; }
      else if (gecSize === "3/0") { gecEntry = "30"; gecDisplay = "3/0 (enter 30)"; }

      return `Service conductor: ${conductor.size} AWG/kcmil (${conductor.ampacity}A)\n\nTable 250.66:\n${conductor.size} conductor → ${gecSize} AWG GEC\n\nEnter: ${gecEntry}`;
    },
    necReference: "NEC Table 250.66",
    inputType: "calculation",
    formula: "Service conductor size → Table 250.66 → GEC AWG",
    expectedAnswer: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      const conductor = getConductorSize(amps);
      const gecSize = getGECSize(conductor.size);
      // Convert to numeric: 1/0→10, 2/0→20, 3/0→30, else parse
      if (gecSize === "1/0") return 10;
      if (gecSize === "2/0") return 20;
      if (gecSize === "3/0") return 30;
      return parseInt(gecSize);
    },
    validateAnswer: (user, expected) => user === expected,
  },
];
