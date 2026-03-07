// Table 220.55 — Demand Factors and Loads for Household Cooking Appliances
// Used for dwelling unit service/feeder calculations (NEC Article 220)

// Column C maximum demand (kW) by number of appliances
const COLUMN_C_KW: Record<number, number> = {
  1: 8,
  2: 11,
  3: 14,
  4: 17,
  5: 20,
  6: 21,
};

export interface CookingAppliance {
  name: string;
  watts: number;
}

export interface CookingDemandResult {
  demandVA: number;
  hint: string;
}

/**
 * Calculate demand for household cooking appliances per Table 220.55.
 *
 * Single appliance:
 *   - < 3,500W: Column A, 80% of nameplate
 *   - 3,500–8,750W: Column B, 80% of nameplate
 *   - ≥ 8,750W: Column C (8 kW for ≤12 kW, +5% per kW over 12 per Note 1)
 *
 * Multiple appliances — Note 2 averaging method:
 *   1. Bump any appliance rated < 12 kW up to 12 kW
 *   2. Average the adjusted ratings
 *   3. Look up Column C base demand for the number of appliances
 *   4. Increase by 5% per kW (or major fraction thereof) the average exceeds 12 kW
 */
export function calculateCookingDemand(appliances: CookingAppliance[]): CookingDemandResult {
  if (appliances.length === 0) {
    return { demandVA: 0, hint: "No cooking equipment — enter 0." };
  }

  if (appliances.length === 1) {
    return calculateSingleAppliance(appliances[0]);
  }

  return calculateNote2(appliances);
}

// ─── Single appliance ─────────────────────────────────────────────────────────

function calculateSingleAppliance(appliance: CookingAppliance): CookingDemandResult {
  const { name, watts } = appliance;
  let hint = `${name}: ${watts.toLocaleString()} W\n\n`;

  if (watts < 3500) {
    const demand = Math.round(watts * 0.80);
    hint += `Column A (<3½ kW): 80% of nameplate\n${watts.toLocaleString()} × 0.80 = ${demand.toLocaleString()} VA`;
    return { demandVA: demand, hint };
  }

  if (watts < 8750) {
    const demand = Math.round(watts * 0.80);
    hint += `Column B (3½–8¾ kW): 80% of nameplate\n${watts.toLocaleString()} × 0.80 = ${demand.toLocaleString()} VA`;
    return { demandVA: demand, hint };
  }

  if (watts <= 12000) {
    hint += `Column C (≥8¾ kW, ≤12 kW): 8,000 VA maximum demand`;
    return { demandVA: 8000, hint };
  }

  // > 12 kW — Note 1: increase 5% per kW or major fraction thereof over 12 kW
  const overKW = Math.round((watts - 12000) / 1000);
  const multiplier = 1 + overKW * 0.05;
  const demand = Math.round(8000 * multiplier);
  hint += `Column C, Note 1: Exceeds 12 kW by ${overKW} kW\n`;
  hint += `8,000 × ${multiplier.toFixed(2)} = ${demand.toLocaleString()} VA`;
  return { demandVA: demand, hint };
}

// ─── Multiple appliances — Note 2 averaging method ────────────────────────────

function calculateNote2(appliances: CookingAppliance[]): CookingDemandResult {
  const count = appliances.length;
  const baseDemandKW = COLUMN_C_KW[Math.min(count, 6)] ?? 21;

  let hint = `Table 220.55, Note 2 — ${count} cooking appliances\n\n`;

  // Step 1: Adjust ratings (minimum 12 kW each)
  hint += `Step 1 — Adjust ratings (min 12 kW each):\n`;
  const adjustedKW: number[] = [];
  appliances.forEach(a => {
    const ratingKW = a.watts / 1000;
    const adjusted = Math.max(ratingKW, 12);
    adjustedKW.push(adjusted);
    if (ratingKW < 12) {
      hint += `  ${a.name} (${ratingKW} kW) → 12 kW\n`;
    } else {
      hint += `  ${a.name}: ${ratingKW} kW\n`;
    }
  });

  // Step 2: Average
  const totalKW = adjustedKW.reduce((sum, kw) => sum + kw, 0);
  const averageKW = totalKW / count;
  hint += `\nStep 2 — Average: ${totalKW} kW ÷ ${count} = ${averageKW} kW\n`;

  // Step 3: Column C base demand
  hint += `\nStep 3 — Column C for ${count} appliances: ${baseDemandKW} kW\n`;

  // Step 4 & 5: Multiplier and final demand
  let multiplier = 1;
  if (averageKW > 12) {
    // "kW or major fraction thereof" — Math.round handles ≥ 0.5 correctly
    const overKW = Math.round(averageKW - 12);
    const increase = overKW * 0.05;
    multiplier = 1 + increase;
    hint += `\nStep 4 — Average exceeds 12 kW by ${overKW} kW`;
    hint += `\n  ${overKW} kW × 5% = ${(increase * 100).toFixed(0)}% increase\n`;
  }

  const demandKW = baseDemandKW * multiplier;
  const demandVA = Math.round(demandKW * 1000);
  hint += `\nStep 5 — ${baseDemandKW} kW × ${multiplier.toFixed(2)} = ${demandKW % 1 === 0 ? demandKW : demandKW.toFixed(1)} kW = ${demandVA.toLocaleString()} VA`;

  return { demandVA, hint };
}
