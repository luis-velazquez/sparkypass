// Shared NEC type definitions

export interface DemandTier {
  upToVA: number;       // Apply this rate up to this VA value
  factor: number;       // Demand factor (e.g., 1.0 = 100%, 0.5 = 50%)
}

export interface ConductorEntry {
  size: string;             // AWG or kcmil label (e.g., "14", "1/0", "300")
  ampacity: number;         // Copper ampacity at 75°C
  aluminumAmpacity: number; // Aluminum ampacity at 75°C
}

export interface DwellingConductorEntry {
  serviceRatingAmps: number;
  copper: string;
  aluminum: string;
}

export interface GECEntry {
  maxConductorSize: string;  // Service conductor up to this size
  maxConductorArea: number;  // For comparison (AWG uses negative, kcmil uses positive)
  gecSize: string;           // Required GEC size
}
