// Calculation steps following NEC Article 220 standard method
import type { CalculationStep, HouseScenario } from "./types";
import {
  getMotorAmps,
  hpToWatts,
  roundFractionalAmps,
  getFractionsOfAnAmpereRef,
  getDwellingConductorSize,
  getDwellingAluminumSize,
  getResServicesFeedersTableRef,
  getGECSize,
  parseConductorInput,
  conductorSizeToCode,
} from "../_shared/nec";
import {
  getMotorAppliances,
  getLargestMotorWatts,
  getFixedAppliances,
  getFixedAppliancesWatts,
} from "./helpers";

export const CALCULATION_STEPS: CalculationStep[] = [
  // Step 1: General Lighting (220.41)
  {
    id: "general-lighting",
    title: "General Lighting Load",
    sparkyPrompt: "Let's start the service load calculation. Per 220.41, we use 3 VA per square foot for dwelling units. What's the general lighting load?",
    hint: "Multiply the square footage by 3 VA/sq ft",
    necReference: "NEC 220.41",
    inputType: "calculation",
    formula: "Square Footage × 3 VA/sq ft",
    expectedAnswer: (scenario) => scenario.squareFootage * 3,
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 10,
  },
  // Small Appliance + Laundry (220.52)
  {
    id: "small-appliance-laundry",
    title: "Small Appliance & Laundry Circuits",
    sparkyPrompt: "Now add the small appliance and laundry circuits. Per 220.52, we need 2 small appliance circuits at 1,500 VA each, plus 1 laundry circuit at 1,500 VA. Note — 220.52 permits these loads to be included with the general lighting load, which is why we'll combine them all when applying demand factors in the next step. What's the total?",
    hint: "Small appliance: 2 × 1,500 VA = 3,000 VA\nLaundry: 1 × 1,500 VA\nTotal: 3,000 + 1,500 = 4,500 VA",
    necReference: "NEC 220.52",
    inputType: "calculation",
    formula: "(2 × 1,500 VA) + 1,500 VA",
    expectedAnswer: () => 4500,
    validateAnswer: (user, expected) => user === expected,
  },
  // Apply Lighting Demand (Table 220.45)
  {
    id: "lighting-demand",
    title: "Apply Lighting Demand Factor",
    sparkyPrompt: "Now apply the demand factors from Table 220.45 to the general lighting, small appliance, and laundry loads combined. First 3,000 VA at 100%, from 3,001 to 120,000 VA at 35%, and any remainder over 120,000 VA at 25%. What's the demand load?",
    hint: (scenario, prev) => {
      const lighting = prev["general-lighting"] || scenario.squareFootage * 3;
      const smallAppLaundry = 4500;
      const subtotal = lighting + smallAppLaundry;

      let demand = 0;
      let hint = `Subtotal: ${lighting.toLocaleString()} + 4,500 = ${subtotal.toLocaleString()} VA\n\n`;
      hint += `Table 220.45 Demand Factors:\n`;

      // Tier 1: First 3,000 VA @ 100%
      const tier1 = Math.min(subtotal, 3000);
      const tier1Demand = tier1;
      hint += `First 3,000 VA @ 100% = ${tier1Demand.toLocaleString()} VA\n`;
      demand += tier1Demand;

      if (subtotal > 3000) {
        // Tier 2: 3,001 to 120,000 VA @ 35%
        const tier2 = Math.min(subtotal - 3000, 117000);
        const tier2Demand = Math.round(tier2 * 0.35);
        hint += `Next ${tier2.toLocaleString()} VA @ 35% = ${tier2Demand.toLocaleString()} VA\n`;
        demand += tier2Demand;
      }

      if (subtotal > 120000) {
        // Tier 3: Over 120,000 VA @ 25%
        const tier3 = subtotal - 120000;
        const tier3Demand = Math.round(tier3 * 0.25);
        hint += `Remainder ${tier3.toLocaleString()} VA @ 25% = ${tier3Demand.toLocaleString()} VA\n`;
        demand += tier3Demand;
      }

      hint += `\nDemand Load: ${demand.toLocaleString()} VA`;
      return hint;
    },
    necReference: "NEC Table 220.45",
    inputType: "calculation",
    formula: "3,000 + (next 117,000 × 35%) + (over 120,000 × 25%)",
    expectedAnswer: (scenario, prev) => {
      const lighting = prev["general-lighting"] || scenario.squareFootage * 3;
      const subtotal = lighting + 4500;

      let demand = Math.min(subtotal, 3000); // First 3,000 @ 100%
      if (subtotal > 3000) {
        demand += Math.round(Math.min(subtotal - 3000, 117000) * 0.35); // 3,001–120,000 @ 35%
      }
      if (subtotal > 120000) {
        demand += Math.round((subtotal - 120000) * 0.25); // Over 120,000 @ 25%
      }
      return demand;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // HVAC - Larger of Heat or A/C (220.60)
  {
    id: "hvac",
    title: "HVAC Load (220.60)",
    sparkyPrompt: "Per 220.60, heating and cooling are non-coincident loads — we use the LARGER of the two. But first, the A/C is rated in horsepower, so you'll need to convert it to watts using Table 430.248 (find the amps, then multiply by voltage). Then multiply by 125% (motor load per 220.60), compare to the heating load, and enter the larger value.",
    hint: (scenario) => {
      const ac = scenario.appliances.find(a => a.id === "ac");
      const heat = scenario.appliances.find(a => a.id === "heat");
      const heatWatts = heat?.watts || 0;

      if (!ac?.horsepower || !ac?.motorVoltage) {
        return `No A/C motor — just use the heating load: ${heatWatts.toLocaleString()} VA`;
      }

      const tableColumn = ac.motorVoltage === 120 ? "115V" : "230V";
      const amps = getMotorAmps(ac.horsepower, ac.motorVoltage);
      const acWatts = hpToWatts(ac.horsepower, ac.motorVoltage);
      const acAdjusted = Math.round(acWatts * 1.25);

      const larger = Math.max(heatWatts, acAdjusted);
      const largerName = heatWatts >= acAdjusted ? "Heating" : "A/C (125%)";

      return `A/C: ${ac.horsepower} HP @ ${ac.motorVoltage}V\nTable 430.248 (${tableColumn} column): ${ac.horsepower} HP = ${amps} Amps\n${amps} × ${ac.motorVoltage}V = ${acWatts.toLocaleString()} VA\n${acWatts.toLocaleString()} × 125% = ${acAdjusted.toLocaleString()} VA\n\nHeating: ${heatWatts.toLocaleString()} VA\n\n${largerName} is larger: ${larger.toLocaleString()} VA`;
    },
    necReference: "NEC 220.60",
    inputType: "calculation",
    formula: "Convert A/C (Table 430.248 Amps × V), then: Larger of Heat OR (A/C × 125%)",
    expectedAnswer: (scenario) => {
      const ac = scenario.appliances.find(a => a.id === "ac");
      const heat = scenario.appliances.find(a => a.id === "heat");
      const heatWatts = heat?.watts || 0;
      const acWatts = ac?.horsepower && ac?.motorVoltage ? hpToWatts(ac.horsepower, ac.motorVoltage) : 0;
      const acAdjusted = Math.round(acWatts * 1.25);

      return Math.max(heatWatts, acAdjusted);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Fixed Appliances (220.53)
  {
    id: "fixed-appliances",
    title: "Fixed Appliances (220.53)",
    sparkyPrompt: "Now calculate the fixed appliances load. This includes water heater, dishwasher, disposal, microwave, wine cooler, pool pump, etc. Any motor appliances need to be converted from HP to watts using Table 430.248 (amps × voltage). If you have 4 or more fixed appliances, apply a 75% demand factor.",
    hint: (scenario) => {
      const fixedAppliances = getFixedAppliances(scenario);
      if (fixedAppliances.length === 0) return "No fixed appliances - enter 0.";

      let applianceList = "";
      let total = 0;

      fixedAppliances.forEach(a => {
        if (a.isMotor && a.horsepower && a.motorVoltage) {
          const tableColumn = a.motorVoltage === 120 ? "115V" : "230V";
          const amps = getMotorAmps(a.horsepower, a.motorVoltage);
          const watts = hpToWatts(a.horsepower, a.motorVoltage);
          applianceList += `• ${a.name}: ${a.horsepower} HP → Table 430.248 (${tableColumn}): ${amps}A × ${a.motorVoltage}V = ${watts.toLocaleString()} VA\n`;
          total += watts;
        } else {
          applianceList += `• ${a.name}: ${a.watts.toLocaleString()} VA\n`;
          total += a.watts;
        }
      });

      const hasDemandFactor = fixedAppliances.length >= 4;
      let hint = `Fixed appliances (${fixedAppliances.length}):\n${applianceList}\nTotal: ${total.toLocaleString()} VA`;

      if (hasDemandFactor) {
        const demandTotal = Math.round(total * 0.75);
        hint += `\n\nWith ${fixedAppliances.length} appliances, apply 75% demand:\n${total.toLocaleString()} × 75% = ${demandTotal.toLocaleString()} VA`;
      }

      return hint;
    },
    necReference: "NEC 220.53",
    inputType: "calculation",
    formula: "Sum of fixed appliances (× 75% if 4 or more)",
    expectedAnswer: (scenario) => {
      return getFixedAppliancesWatts(scenario) >= 0
        ? (getFixedAppliances(scenario).length >= 4
          ? Math.round(getFixedAppliancesWatts(scenario) * 0.75)
          : getFixedAppliancesWatts(scenario))
        : 0;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Dryer (220.54)
  {
    id: "dryer",
    title: "Electric Dryer (220.54)",
    sparkyPrompt: "What's the electric dryer load? Per 220.54, use the nameplate rating or 5,000 VA minimum, whichever is larger.",
    hint: "Use the dryer watts from equipment list, or 5,000 VA minimum if less",
    necReference: "NEC 220.54",
    inputType: "calculation",
    formula: "Nameplate rating or 5,000 VA minimum",
    expectedAnswer: (scenario) => {
      const dryer = scenario.appliances.find(a => a.id === "dryer");
      return Math.max(dryer?.watts || 0, 5000);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Range/Cooking (Table 220.55)
  {
    id: "range",
    title: "Range/Cooking Equipment (Table 220.55)",
    sparkyPrompt: "Now for cooking equipment using Table 220.55. First, determine which column applies based on the appliance rating: Column A (<3½ kW) or Column B (3½–8¾ kW) use 80% of nameplate. Column C (≥8¾ kW) uses 8 kW max demand for a single range ≤12 kW, with a 5% increase per kW over 12 kW. If there's a separate cooktop and oven, combine them and use Column C per Note 3.",
    hint: (scenario) => {
      const range = scenario.appliances.find(a => a.id === "range");
      const cooktop = scenario.appliances.find(a => a.id === "cooktop");

      if (!range && !cooktop) return "No cooking equipment — enter 0.";

      let hint = "";

      // Note 3: Separate cooktop + range → combine and use Column C
      if (range && cooktop) {
        const totalWatts = range.watts + cooktop.watts;
        hint = `Note 3: Combine separate units\nRange: ${range.watts.toLocaleString()} W\nCooktop: ${cooktop.watts.toLocaleString()} W\nCombined: ${totalWatts.toLocaleString()} W\n\n`;

        if (totalWatts <= 12000) {
          hint += `Column C: 8,000 VA for ≤12 kW`;
        } else {
          const overKW = Math.ceil((totalWatts - 12000) / 1000);
          const demand = Math.round(8000 * (1 + (overKW * 0.05)));
          hint += `Exceeds 12 kW by ${overKW} kW\n8,000 × ${(1 + overKW * 0.05).toFixed(2)} = ${demand.toLocaleString()} VA`;
        }
        return hint;
      }

      // Single appliance
      const appliance = range || cooktop;
      const watts = appliance!.watts;
      hint = `${appliance!.name}: ${watts.toLocaleString()} W\n\n`;

      if (watts < 3500) {
        hint += `Column A (<3½ kW): 80% of nameplate\n${watts.toLocaleString()} × 0.80 = ${Math.round(watts * 0.80).toLocaleString()} VA`;
      } else if (watts < 8750) {
        hint += `Column B (3½–8¾ kW): 80% of nameplate\n${watts.toLocaleString()} × 0.80 = ${Math.round(watts * 0.80).toLocaleString()} VA`;
      } else if (watts <= 12000) {
        hint += `Column C (≥8¾ kW): 8,000 VA for ≤12 kW`;
      } else {
        const overKW = Math.ceil((watts - 12000) / 1000);
        const demand = Math.round(8000 * (1 + (overKW * 0.05)));
        hint += `Column C: Exceeds 12 kW by ${overKW} kW\n8,000 × ${(1 + overKW * 0.05).toFixed(2)} = ${demand.toLocaleString()} VA`;
      }

      return hint;
    },
    necReference: "NEC Table 220.55",
    inputType: "calculation",
    formula: "Table 220.55 (Col A/B: 80% | Col C: 8 kW for ≤12 kW)",
    expectedAnswer: (scenario) => {
      const range = scenario.appliances.find(a => a.id === "range");
      const cooktop = scenario.appliances.find(a => a.id === "cooktop");

      if (!range && !cooktop) return 0;

      // Note 3: Separate cooktop + range → combine and use Column C
      if (range && cooktop) {
        const totalWatts = range.watts + cooktop.watts;
        if (totalWatts <= 12000) return 8000;
        const overKW = Math.ceil((totalWatts - 12000) / 1000);
        return Math.round(8000 * (1 + (overKW * 0.05)));
      }

      // Single appliance
      const watts = (range || cooktop)!.watts;
      if (watts < 8750) return Math.round(watts * 0.80);
      if (watts <= 12000) return 8000;
      const overKW = Math.ceil((watts - 12000) / 1000);
      return Math.round(8000 * (1 + (overKW * 0.05)));
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 200,
  },
  // Largest Motor +25% (220.50)
  {
    id: "largest-motor-25",
    title: "Largest Motor +25% (220.50)",
    sparkyPrompt: "Per 220.50, we must add 25% of the largest motor to the calculation. Convert each motor from HP to watts using Table 430.248 (amps × voltage), find the largest one, and calculate 25% of its load.",
    hint: (scenario) => {
      const motors = getMotorAppliances(scenario);
      if (motors.length === 0) return "No motors - enter 0.";

      const motorLoads = motors.map(m => {
        const watts = m.horsepower && m.motorVoltage ? hpToWatts(m.horsepower, m.motorVoltage) : m.watts;
        return { name: m.name, watts };
      });

      const motorList = motorLoads.map(m => `• ${m.name}: ${m.watts.toLocaleString()} VA`).join("\n");
      const largest = motorLoads.reduce((max, m) => m.watts > max.watts ? m : max);
      const addition = Math.round(largest.watts * 0.25);

      return `Motors (converted via Table 430.248):\n${motorList}\n\nLargest: ${largest.name} at ${largest.watts.toLocaleString()} VA\n25% of ${largest.watts.toLocaleString()} = ${addition.toLocaleString()} VA`;
    },
    necReference: "NEC 220.50",
    inputType: "calculation",
    formula: "Largest motor VA × 25%",
    expectedAnswer: (scenario) => {
      const largestWatts = getLargestMotorWatts(scenario);
      return Math.round(largestWatts * 0.25);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Total VA
  {
    id: "total-va",
    title: "Total Calculated Load",
    sparkyPrompt: "Now add up ALL the loads: lighting demand, HVAC, fixed appliances, dryer, range, and the 25% motor addition. What's the total VA?",
    hint: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const fixed = prev["fixed-appliances"] || 0;
      const dryer = prev["dryer"] || 0;
      const range = prev["range"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;

      // Check for other loads (hot tub, EV charger)
      const otherLoads = scenario.appliances.filter(a =>
        ["hot-tub", "ev-charger"].includes(a.id)
      );
      const otherTotal = otherLoads.reduce((sum, a) => sum + a.watts, 0);

      let hint = `Lighting Demand: ${lightingDemand.toLocaleString()} VA\n`;
      hint += `HVAC: ${hvac.toLocaleString()} VA\n`;
      hint += `Fixed Appliances: ${fixed.toLocaleString()} VA\n`;
      hint += `Dryer: ${dryer.toLocaleString()} VA\n`;
      hint += `Range: ${range.toLocaleString()} VA\n`;
      hint += `Largest Motor 25%: ${motor25.toLocaleString()} VA\n`;

      if (otherTotal > 0) {
        hint += `Other Loads: ${otherTotal.toLocaleString()} VA\n`;
        otherLoads.forEach(a => {
          hint += `  • ${a.name}: ${a.watts.toLocaleString()} VA\n`;
        });
      }

      const total = lightingDemand + hvac + fixed + dryer + range + motor25 + otherTotal;
      hint += `\nTotal: ${total.toLocaleString()} VA`;

      return hint;
    },
    necReference: "NEC 220.40",
    inputType: "calculation",
    formula: "Sum of all calculated loads",
    expectedAnswer: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const fixed = prev["fixed-appliances"] || 0;
      const dryer = prev["dryer"] || 0;
      const range = prev["range"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;

      // Add other loads (hot tub, EV charger)
      const otherLoads = scenario.appliances.filter(a =>
        ["hot-tub", "ev-charger"].includes(a.id)
      );
      const otherTotal = otherLoads.reduce((sum, a) => sum + a.watts, 0);

      return lightingDemand + hvac + fixed + dryer + range + motor25 + otherTotal;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 500,
  },
  // Service Amps
  {
    id: "service-amps",
    title: (v) => `Service Size (${getFractionsOfAnAmpereRef(v)})`,
    sparkyPrompt: (_scenario, v = "2023") => {
      const ref = getFractionsOfAnAmpereRef(v);
      return `Divide the total VA by 240V to get the minimum amperage, then round per ${ref}: if the decimal is 0.5 or greater, round up. Enter the rounded whole number.`;
    },
    hint: (_scenario, prev, v = "2023") => {
      const ref = getFractionsOfAnAmpereRef(v);
      const totalVA = prev["total-va"] || 0;
      const rawAmps = totalVA / 240;
      const roundedAmps = roundFractionalAmps(rawAmps);
      const standardSizes = [100, 125, 150, 200, 225, 400];
      const serviceSize = standardSizes.find(size => size >= roundedAmps) || 400;

      return `${totalVA.toLocaleString()} VA ÷ 240V = ${rawAmps.toFixed(1)} → ${roundedAmps}A per ${ref}\n\nStandard sizes: 100A, 125A, 150A, 200A, 225A, 400A\nRounds up to: ${serviceSize}A`;
    },
    necReference: (v) => `NEC ${getFractionsOfAnAmpereRef(v)}, ${getResServicesFeedersTableRef(v)}`,
    inputType: "calculation",
    formula: (_scenario, v = "2023") => `Total VA ÷ 240V → round per ${getFractionsOfAnAmpereRef(v)}`,
    expectedAnswer: (_scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      return roundFractionalAmps(totalVA / 240);
    },
    validateAnswer: (user, expected) => user === expected,
    storedAnswer: (_scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = roundFractionalAmps(totalVA / 240);
      const standardSizes = [100, 125, 150, 200, 225, 400];
      return standardSizes.find(size => size >= amps) || 400;
    },
  },
  // Service Conductor Sizing — table ref is version-aware
  {
    id: "service-conductor",
    title: (v) => `Service Conductor (${getResServicesFeedersTableRef(v)})`,
    sparkyPrompt: (_scenario, v = "2023") => {
      const ref = getResServicesFeedersTableRef(v);
      return `Now let's size the service conductor. Using ${ref}, find the copper conductor size for your service rating. Enter the wire size (e.g., 4, 2, 1/0, 3/0, 250).`;
    },
    hint: (_scenario, prev, v = "2023") => {
      const ref = getResServicesFeedersTableRef(v);
      const serviceAmps = prev["service-amps"] || 0;
      const copperSize = getDwellingConductorSize(serviceAmps);
      const aluminumSize = getDwellingAluminumSize(serviceAmps);

      return `Service rating: ${serviceAmps}A\n\n${ref} — Copper: ${copperSize} AWG/kcmil\n${ref} — Aluminum: ${aluminumSize} AWG/kcmil\n\nEnter copper size: ${copperSize}`;
    },
    necReference: (v) => `NEC ${getResServicesFeedersTableRef(v)}`,
    inputType: "calculation",
    formula: (_scenario, v = "2023") => `Service rating → ${getResServicesFeedersTableRef(v)} → copper conductor`,
    parseInput: parseConductorInput,
    expectedAnswer: (scenario, prev) => {
      const serviceAmps = prev["service-amps"] || 0;
      return conductorSizeToCode(getDwellingConductorSize(serviceAmps));
    },
    validateAnswer: (user, expected) => user === expected,
  },
  // GEC Sizing (Table 250.66)
  {
    id: "gec-size",
    title: "GEC Sizing (Table 250.66)",
    sparkyPrompt: "Finally, size the Grounding Electrode Conductor (GEC) using Table 250.66. Look up the service conductor size from the previous step and find the required GEC size. Enter the GEC AWG number (use 10 for 1/0, 20 for 2/0, 30 for 3/0).",
    hint: (scenario, prev) => {
      const serviceAmps = prev["service-amps"] || 0;
      const copperSize = getDwellingConductorSize(serviceAmps);
      const gecSize = getGECSize(copperSize);

      let gecEntry = gecSize;
      if (gecSize === "1/0") { gecEntry = "10"; }
      else if (gecSize === "2/0") { gecEntry = "20"; }
      else if (gecSize === "3/0") { gecEntry = "30"; }

      return `Service conductor: ${copperSize} AWG/kcmil\n\nTable 250.66:\n${copperSize} conductor → ${gecSize} AWG GEC\n\nEnter: ${gecEntry}`;
    },
    necReference: "NEC Table 250.66",
    inputType: "calculation",
    formula: "Service conductor size → Table 250.66 → GEC AWG",
    expectedAnswer: (scenario, prev) => {
      const serviceAmps = prev["service-amps"] || 0;
      const copperSize = getDwellingConductorSize(serviceAmps);
      const gecSize = getGECSize(copperSize);
      if (gecSize === "1/0") return 10;
      if (gecSize === "2/0") return 20;
      if (gecSize === "3/0") return 30;
      return parseInt(gecSize);
    },
    validateAnswer: (user, expected) => user === expected,
  },
];

// Filter steps based on scenario equipment — skips steps whose shouldShow returns false
export function getFilteredSteps(scenario: HouseScenario): CalculationStep[] {
  return CALCULATION_STEPS.filter(step => !step.shouldShow || step.shouldShow(scenario));
}
