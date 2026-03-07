"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Home,
  Building2,
  Store,
  UtensilsCrossed,
  Warehouse,
  Play,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HOUSE_SCENARIOS, getFilteredSteps, type HouseScenario } from "./residential/calculator-data";
import { BUILDING_TYPES, ALL_COMMERCIAL_SCENARIOS, COMMERCIAL_CALCULATION_STEPS, type CommercialScenario } from "./commercial/calculator-data";
import type { DifficultyLevel, SavedProgress } from "./_shared/types";
import { DIFFICULTY_LEVELS } from "./_shared/types";

type CalcMode = "residential" | "commercial";

const MODE_STORAGE_KEY = "sparkypass-calc-mode";
const RES_STORAGE_KEY = "sparkypass-load-calculator";
const COM_STORAGE_KEY = "sparkypass-commercial-load-calculator";

// ── Difficulty color system ──
// Each level owns a color so the user can scan the spectrum at a glance.
const DIFFICULTY_PILL: Record<DifficultyLevel, { active: string; inactive: string }> = {
  beginner: {
    active:   "bg-emerald text-white dark:bg-sparky-green dark:text-stone-950 shadow-sm",
    inactive: "text-emerald dark:text-sparky-green/80 hover:text-emerald hover:bg-emerald/5 dark:hover:bg-sparky-green/10",
  },
  intermediate: {
    active:   "bg-amber text-white dark:bg-amber dark:text-white shadow-sm",
    inactive: "text-amber/80 hover:text-amber hover:bg-amber/5 dark:text-amber/70 dark:hover:text-amber dark:hover:bg-amber/10",
  },
  expert: {
    active:   "bg-red-500 text-white dark:bg-red-500 dark:text-white shadow-sm",
    inactive: "text-red-500/80 hover:text-red-500 hover:bg-red-500/5 dark:text-red-500/70 dark:hover:text-red-500 dark:hover:bg-red-500/10",
  },
};

// Accent colors that flow from the active difficulty into scenario cards.
const DIFFICULTY_ACCENT: Record<DifficultyLevel, {
  iconBg: string;
  iconText: string;
  border: string;
  hoverBorder: string;
}> = {
  beginner: {
    iconBg:      "bg-emerald/10 dark:bg-sparky-green/10",
    iconText:    "text-emerald dark:text-sparky-green",
    border:      "border-l-[3px] border-l-emerald/40 dark:border-l-sparky-green/40",
    hoverBorder: "hover:border-emerald/50 dark:hover:border-sparky-green/50",
  },
  intermediate: {
    iconBg:      "bg-amber/10 dark:bg-amber/10",
    iconText:    "text-amber dark:text-amber",
    border:      "border-l-[3px] border-l-amber/40 dark:border-l-amber/40",
    hoverBorder: "hover:border-amber/50 dark:hover:border-amber/50",
  },
  expert: {
    iconBg:      "bg-red-500/10 dark:bg-red-500/10",
    iconText:    "text-red-500 dark:text-red-400",
    border:      "border-l-[3px] border-l-red-500/40 dark:border-l-red-400/40",
    hoverBorder: "hover:border-red-500/50 dark:hover:border-red-400/50",
  },
};

function BuildingTypeIcon({ type, className }: { type: string; className: string }) {
  switch (type) {
    case "retail": return <Store className={className} />;
    case "restaurant": return <UtensilsCrossed className={className} />;
    case "office": return <Building2 className={className} />;
    case "warehouse": return <Warehouse className={className} />;
    default: return <Building2 className={className} />;
  }
}

export default function LoadCalculatorLandingPage() {
  const { status } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<CalcMode>("residential");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [buildingType, setBuildingType] = useState("retail");
  const [resSavedProgress, setResSavedProgress] = useState<SavedProgress | null>(null);
  const [comSavedProgress, setComSavedProgress] = useState<SavedProgress | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
    if (savedMode === "commercial") setMode("commercial");

    // Load residential saved progress
    const resSaved = localStorage.getItem(RES_STORAGE_KEY);
    if (resSaved) {
      try {
        const parsed = JSON.parse(resSaved) as SavedProgress;
        if (parsed.scenarioId && HOUSE_SCENARIOS.find(s => s.id === parsed.scenarioId)) {
          setResSavedProgress(parsed);
        }
      } catch { /* ignore */ }
    }

    // Load commercial saved progress
    const comSaved = localStorage.getItem(COM_STORAGE_KEY);
    if (comSaved) {
      try {
        const parsed = JSON.parse(comSaved) as SavedProgress;
        if (parsed.scenarioId) {
          // Legacy ID migration
          const LEGACY_ID_MAP: Record<string, string> = {
            retail: "retail-1",
            restaurant: "restaurant-1",
            office: "office-1",
            warehouse: "warehouse-1",
          };
          if (LEGACY_ID_MAP[parsed.scenarioId]) {
            parsed.scenarioId = LEGACY_ID_MAP[parsed.scenarioId];
          }
          if (ALL_COMMERCIAL_SCENARIOS.find(s => s.id === parsed.scenarioId)) {
            setComSavedProgress(parsed);
          }
        }
      } catch { /* ignore */ }
    }

    setMounted(true);
  }, [status, router]);

  // Filter scenarios based on current mode, difficulty, and building type
  const filteredScenarios = useMemo((): (HouseScenario | CommercialScenario)[] => {
    if (mode === "residential") {
      return HOUSE_SCENARIOS.filter(s => s.difficulty === difficulty);
    }
    const bt = BUILDING_TYPES.find(b => b.buildingType === buildingType);
    if (!bt) return [];
    return bt.variants.filter(v => v.difficulty === difficulty);
  }, [mode, difficulty, buildingType]);

  const handleModeChange = useCallback((newMode: CalcMode) => {
    setMode(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  }, []);

  const handleSelectScenario = useCallback((scenario: HouseScenario | CommercialScenario) => {
    if (mode === "residential") {
      router.push(`/load-calculator/residential?scenario=${scenario.id}`);
    } else {
      router.push(`/load-calculator/commercial?scenario=${scenario.id}`);
    }
  }, [mode, router]);

  const handleContinueResidential = useCallback(() => {
    router.push("/load-calculator/residential?resume=true");
  }, [router]);

  const handleContinueCommercial = useCallback(() => {
    router.push("/load-calculator/commercial?resume=true");
  }, [router]);

  if (status === "loading" || !mounted) {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  // Get saved progress info for continue cards
  const resSavedScenario = resSavedProgress
    ? HOUSE_SCENARIOS.find(s => s.id === resSavedProgress.scenarioId)
    : null;
  const comSavedScenario = comSavedProgress
    ? ALL_COMMERCIAL_SCENARIOS.find(s => s.id === comSavedProgress.scenarioId)
    : null;

  // Whether any continue card is showing — affects spacing
  const hasContinue = !!(resSavedScenario && resSavedProgress) || !!(comSavedScenario && comSavedProgress);

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* φ-proportioned container: 610px ≈ 377 + 233 (Fibonacci) */}
      <div className="container mx-auto px-5 pt-[55px] pb-13 relative z-10 max-w-[610px]">

        {/* ── Zone 1: Header ── generous breathing room (34px below) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-[34px] text-center"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1.5">
            <span className="text-amber dark:text-sparky-green">Load Calculator</span>
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Practice NEC Article 220 calculations
          </p>
        </motion.div>

        {/* ── Zone 2: Continue cards (conditional) ── */}
        {hasContinue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-[21px] space-y-2"
          >
            {resSavedScenario && resSavedProgress && (
              <Card
                className={`cursor-pointer ${DIFFICULTY_ACCENT[resSavedScenario.difficulty].border} ${DIFFICULTY_ACCENT[resSavedScenario.difficulty].hoverBorder} hover:shadow-md transition-all duration-300 pressable border-border dark:border-stone-800 bg-card/50 dark:bg-stone-900/30`}
                onClick={handleContinueResidential}
              >
                <CardContent className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md ${DIFFICULTY_ACCENT[resSavedScenario.difficulty].iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Play className={`h-4 w-4 ${DIFFICULTY_ACCENT[resSavedScenario.difficulty].iconText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight">Continue: {resSavedScenario.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Step {(resSavedProgress.currentStepIndex || 0) + 1} of {getFilteredSteps(resSavedScenario).length} &middot; {resSavedScenario.squareFootage.toLocaleString()} sq ft
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            )}

            {comSavedScenario && comSavedProgress && (
              <Card
                className={`cursor-pointer ${DIFFICULTY_ACCENT[comSavedScenario.difficulty].border} ${DIFFICULTY_ACCENT[comSavedScenario.difficulty].hoverBorder} hover:shadow-md transition-all duration-300 pressable border-border dark:border-stone-800 bg-card/50 dark:bg-stone-900/30`}
                onClick={handleContinueCommercial}
              >
                <CardContent className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md ${DIFFICULTY_ACCENT[comSavedScenario.difficulty].iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Play className={`h-4 w-4 ${DIFFICULTY_ACCENT[comSavedScenario.difficulty].iconText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight">Continue: {comSavedScenario.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Step {(comSavedProgress.currentStepIndex || 0) + 1} of {COMMERCIAL_CALCULATION_STEPS.length} &middot; {comSavedScenario.squareFootage.toLocaleString()} sq ft
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ── Zone 3: Controls cluster ── tightly grouped (8px gaps internal) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center gap-2 mb-[21px]"
        >
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-muted dark:bg-stone-800 rounded-lg">
            <button
              onClick={() => handleModeChange("residential")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                mode === "residential"
                  ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              Residential
            </button>
            <button
              onClick={() => handleModeChange("commercial")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                mode === "commercial"
                  ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Commercial
            </button>
          </div>

          {/* Building Type Selector (commercial only) */}
          {mode === "commercial" && (
            <div className="flex gap-1 p-1 bg-muted dark:bg-stone-800 rounded-lg flex-wrap justify-center">
              {BUILDING_TYPES.map(bt => (
                <button
                  key={bt.buildingType}
                  onClick={() => setBuildingType(bt.buildingType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                    buildingType === bt.buildingType
                      ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BuildingTypeIcon type={bt.buildingType} className="h-4 w-4" />
                  {bt.name}
                </button>
              ))}
            </div>
          )}

          {/* Difficulty Selector */}
          <div className="flex gap-1 p-1 bg-muted dark:bg-stone-800 rounded-lg">
            {DIFFICULTY_LEVELS.map(level => (
              <button
                key={level.id}
                onClick={() => setDifficulty(level.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                  difficulty === level.id
                    ? DIFFICULTY_PILL[level.id].active
                    : DIFFICULTY_PILL[level.id].inactive
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Zone 4: Scenario list ── primary content area */}
        {filteredScenarios.length > 0 ? (
          <div className="space-y-2">
            {filteredScenarios.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 + index * 0.06 }}
              >
                <Card
                  className={`cursor-pointer ${DIFFICULTY_ACCENT[difficulty].hoverBorder} hover:shadow-md transition-all duration-300 pressable ${DIFFICULTY_ACCENT[difficulty].border} border-border dark:border-stone-800 bg-card dark:bg-stone-900/50`}
                  onClick={() => handleSelectScenario(scenario)}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-[38px] h-[38px] rounded-lg ${DIFFICULTY_ACCENT[difficulty].iconBg} flex items-center justify-center flex-shrink-0`}>
                        {mode === "residential"
                          ? <Home className={`h-[18px] w-[18px] ${DIFFICULTY_ACCENT[difficulty].iconText}`} />
                          : <BuildingTypeIcon type={(scenario as CommercialScenario).buildingType} className={`h-[18px] w-[18px] ${DIFFICULTY_ACCENT[difficulty].iconText}`} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-semibold text-[15px] leading-tight">{scenario.name}</h3>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {scenario.squareFootage.toLocaleString()} sq ft
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug line-clamp-1 sm:line-clamp-2">{scenario.description}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">
                          {mode === "residential"
                            ? `${(scenario as HouseScenario).appliances.length} appliances · ${getFilteredSteps(scenario as HouseScenario).length} steps`
                            : `${(scenario as CommercialScenario).phases}Ø ${scenario.voltage}V · ${COMMERCIAL_CALCULATION_STEPS.length} steps`
                          }
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
              <CardContent className="py-12 text-center">
                <div className={`w-12 h-12 rounded-full ${DIFFICULTY_ACCENT[difficulty].iconBg} flex items-center justify-center mx-auto mb-3`}>
                  {mode === "residential"
                    ? <Home className={`h-5 w-5 ${DIFFICULTY_ACCENT[difficulty].iconText}`} />
                    : <Building2 className={`h-5 w-5 ${DIFFICULTY_ACCENT[difficulty].iconText}`} />
                  }
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No scenarios found</p>
                <p className="text-xs text-muted-foreground">
                  Try a different difficulty level{mode === "commercial" ? " or building type" : ""}.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </main>
  );
}
