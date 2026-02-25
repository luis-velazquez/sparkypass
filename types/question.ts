// Question Types for SparkyPass Quiz System

export type Difficulty = "apprentice" | "journeyman" | "master";

export type CategorySlug = "load-calculations" | "grounding-bonding" | "services" | "textbook-navigation" | "chapter-9-tables" | "box-fill" | "conduit-fill" | "voltage-drop" | "motor-calculations" | "temperature-correction" | "resistance" | "transformer-sizing" | "mobile-homes" | "swimming-pools";

export interface Category {
  slug: CategorySlug;
  name: string;
  necArticle: string;
  description: string;
}

export interface Question {
  id: string;
  category: CategorySlug;
  necArticle: string;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-3)
  explanation: string;
  necReference: string;
  sparkyTip: string;
}

// Category definitions
export const CATEGORIES: Category[] = [
  {
    slug: "load-calculations",
    name: "Load Calculations",
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
    slug: "textbook-navigation",
    name: "Textbook Navigation",
    necArticle: "Article 90",
    description: "How to navigate the NEC code book, chapter organization, and finding rules",
  },
  {
    slug: "chapter-9-tables",
    name: "Chapter 9 Tables",
    necArticle: "Chapter 9",
    description: "Conduit fill calculations, conductor properties, and raceway dimensions",
  },
  {
    slug: "box-fill",
    name: "Box Fill",
    necArticle: "Article 314 & 310",
    description: "Box fill calculations, conductor counting, pull/junction box sizing, and volume requirements",
  },
  {
    slug: "conduit-fill",
    name: "Conduit Fill",
    necArticle: "Chapter 9 Tables",
    description: "Raceway sizing, conductor area calculations, and conduit fill percentages",
  },
  {
    slug: "voltage-drop",
    name: "Voltage Drop",
    necArticle: "Chapter 9, Tables 8 & 9",
    description: "Voltage drop formulas, conductor sizing for distance, and NEC recommendations",
  },
  {
    slug: "motor-calculations",
    name: "Motor Calculations",
    necArticle: "Article 430",
    description: "Motor FLC, conductor sizing, overload protection, and short-circuit protection",
  },
  {
    slug: "temperature-correction",
    name: "Temperature Correction",
    necArticle: "Table 310.15(B)(1)",
    description: "Ambient temperature correction factors, conductor derating, and ampacity adjustments",
  },
  {
    slug: "resistance",
    name: "Finding Resistance",
    necArticle: "Chapter 9, Table 8",
    description: "Conductor resistance formulas, K factors, and calculating resistance from voltage drop",
  },
  {
    slug: "transformer-sizing",
    name: "Transformer Sizing",
    necArticle: "Article 450",
    description: "Transformer kVA sizing, overcurrent protection, and impedance calculations",
  },
  {
    slug: "mobile-homes",
    name: "Mobile Homes",
    necArticle: "Article 550",
    description: "Mobile home power supply, cord requirements, park electrical systems, and service equipment",
  },
  {
    slug: "swimming-pools",
    name: "Swimming Pools",
    necArticle: "Article 680",
    description: "Swimming pools, fountains, and similar installations — GFCI, bonding, clearances, and wiring methods",
  },
];

// Helper to get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// Parent category groupings for the quiz landing page
export type ParentCategorySlug = "general-code" | "tables" | "special-code" | "communications-code";

export interface ParentCategory {
  slug: ParentCategorySlug;
  name: string;
  necChapters: string;
  description: string;
  categorySlugs: CategorySlug[];
}

export const PARENT_CATEGORIES: ParentCategory[] = [
  {
    slug: "general-code",
    name: "General Code",
    necChapters: "Chapters 1–4",
    description: "Core NEC requirements covering installations, wiring methods, equipment, and general-use circuits",
    categorySlugs: ["load-calculations", "grounding-bonding", "services", "textbook-navigation", "box-fill", "motor-calculations", "temperature-correction", "transformer-sizing"],
  },
  {
    slug: "tables",
    name: "Tables",
    necChapters: "Chapter 9",
    description: "NEC Chapter 9 tables for conduit fill, conductor properties, and voltage drop",
    categorySlugs: ["chapter-9-tables", "conduit-fill", "voltage-drop", "resistance"],
  },
  {
    slug: "special-code",
    name: "Special Code",
    necChapters: "Chapters 5–7",
    description: "Special occupancies, special equipment, and special conditions",
    categorySlugs: ["mobile-homes", "swimming-pools"],
  },
  {
    slug: "communications-code",
    name: "Communications Code",
    necChapters: "Chapter 8",
    description: "Communications systems, including network-powered broadband and CATV",
    categorySlugs: [],
  },
];

export function getParentCategoryBySlug(slug: string): ParentCategory | undefined {
  return PARENT_CATEGORIES.find((c) => c.slug === slug);
}
