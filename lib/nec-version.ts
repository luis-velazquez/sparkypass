import { useState, useEffect } from "react";
import type { Question, NecVersion } from "@/types/question";

/** Resolve the NEC reference for a specific code year, falling back to the base field. */
export function getNecReference(q: Question, version: NecVersion): string {
  return q.necReferences?.[version] ?? q.necReference;
}

/** Resolve the explanation for a specific code year, falling back to the base field. */
export function getExplanation(q: Question, version: NecVersion): string {
  return q.explanations?.[version] ?? q.explanation;
}

/** Resolve the Sparky tip for a specific code year, falling back to the base field. */
export function getSparkyTip(q: Question, version: NecVersion): string {
  return q.sparkyTips?.[version] ?? q.sparkyTip;
}

/**
 * React hook that returns the user's selected NEC version.
 * Reads from the profile API on mount and listens for the
 * `nec-year-updated` custom event dispatched by the settings page.
 */
export function useNecVersion(): { necVersion: NecVersion } {
  const [necVersion, setNecVersion] = useState<NecVersion>("2023");

  useEffect(() => {
    // Fetch user profile to get their saved NEC year
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.necYear === "2023" || data?.necYear === "2026") {
          setNecVersion(data.necYear);
        }
      })
      .catch(() => {});

    // Listen for live updates from the settings page
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "2023" || detail === "2026") {
        setNecVersion(detail);
      }
    };
    window.addEventListener("nec-year-updated", handler);
    return () => window.removeEventListener("nec-year-updated", handler);
  }, []);

  return { necVersion };
}
