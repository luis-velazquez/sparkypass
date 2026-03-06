// Get service amps based on scenario voltage/phases
// NEC Annex D uses 360 as the constant for 208V 3-phase (not 208x sqrt(3)=360.06)

export function getServiceAmps(totalVA: number, voltage: number, phases: 1 | 3): number {
  if (phases === 3) {
    const divisor = voltage === 208 ? 360 : voltage * Math.sqrt(3);
    return totalVA / divisor;
  }
  return totalVA / voltage;
}
