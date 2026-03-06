"use client";

import { useState, useEffect } from "react";
import { Home, Building2 } from "lucide-react";
import ResidentialPage from "./residential/page";
import CommercialPage from "./commercial/page";

type CalcMode = "residential" | "commercial";
const STORAGE_KEY = "sparkypass-calc-mode";

export default function LoadCalculatorTogglePage() {
  const [mode, setMode] = useState<CalcMode>("residential");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "commercial") setMode("commercial");
  }, []);

  const handleModeChange = (newMode: CalcMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggle = (
    <div className="flex gap-1 p-1 bg-muted dark:bg-stone-800 rounded-lg">
      <button
        onClick={() => handleModeChange("residential")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === "residential"
            ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950 shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Home className="h-3.5 w-3.5" />
        Residential
      </button>
      <button
        onClick={() => handleModeChange("commercial")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === "commercial"
            ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950 shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Building2 className="h-3.5 w-3.5" />
        Commercial
      </button>
    </div>
  );

  return mode === "residential"
    ? <ResidentialPage headerExtra={toggle} />
    : <CommercialPage headerExtra={toggle} />;
}
