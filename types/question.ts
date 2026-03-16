// Question Types for SparkyPass Quiz System

export type Difficulty = "apprentice" | "journeyman" | "master";

export type NecVersion = "2023" | "2026";

export type CategorySlug = "calculations-and-theory" | "grounding-bonding" | "services" | "box-fill" | "motors-and-generators" | "transformer-sizing" | "special-occupancies" | "wiring-methods";

export interface Category {
  slug: CategorySlug;
  name: string;
  necArticle: string;
  description: string;
}

export interface Question {
  id: string;
  category: CategorySlug;
  necArticle?: string;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-3)
  explanation: string;
  necReference: string;
  sparkyTip: string;
  necVersions: NecVersion[];
  // Optional version-specific overrides (only when content differs by year)
  necReferences?: Partial<Record<NecVersion, string>>;
  explanations?: Partial<Record<NecVersion, string>>;
  sparkyTips?: Partial<Record<NecVersion, string>>;
}

// Category definitions
export const CATEGORIES: Category[] = [
  {
    slug: "calculations-and-theory",
    name: "Calculations & Theory",
    necArticle: "Article 220",
    description: "Branch circuit and feeder calculations, demand factors, and service sizing",
  },
  {
    slug: "grounding-bonding",
    name: "Grounding & Bonding",
    necArticle: "Article 250",
    description: "Equipment grounding, bonding requirements, and grounding electrode systems",
  },
  {
    slug: "services",
    name: "Services",
    necArticle: "Article 230",
    description: "Service entrance equipment, conductors, and disconnecting means",
  },
{
    slug: "box-fill",
    name: "Box Fill",
    necArticle: "Article 314 & 310",
    description: "Box fill calculations, conductor counting, pull/junction box sizing, and volume requirements",
  },
  {
    slug: "motors-and-generators",
    name: "Motors & Generators",
    necArticle: "Article 430",
    description: "Motor FLC, conductor sizing, overload protection, and short-circuit protection",
  },
  {
    slug: "transformer-sizing",
    name: "Transformer Sizing",
    necArticle: "Article 450",
    description: "Transformer kVA sizing, overcurrent protection, and impedance calculations",
  },
  {
    slug: "special-occupancies",
    name: "Special Occupancies, Equipment & Conditions",
    necArticle: "Articles 550, 680",
    description: "Mobile homes, swimming pools, fountains, and similar special occupancies — GFCI, bonding, clearances, and wiring methods",
  },
  {
    slug: "wiring-methods",
    name: "Wiring Methods",
    necArticle: "Articles 300–398",
    description: "Raceways, cables, and installation rules for NM, MC, EMT, RMC, and other wiring methods",
  },
];

// Helper to get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

