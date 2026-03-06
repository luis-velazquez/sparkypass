import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import type { NecVersion } from "@/types/question";

// Fire confetti celebration
export function fireConfetti() {
  haptic("celebration");
  // Fire from left side
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.1, y: 0.6 },
  });
  // Fire from right side
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.9, y: 0.6 },
  });
}

// Format number with commas for display
export function formatNumberWithCommas(value: string): string {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, "");

  // Split by decimal point
  const parts = cleaned.split(".");

  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Rejoin with decimal if present
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

// Parse formatted number back to raw value
export function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, ""));
}

// Get a random message from an array
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Helper to get hint text (handles both string and function hints)
export function getHintText<TScenario>(
  step: { hint: string | ((scenario: TScenario, previousAnswers: Record<string, number>, necVersion?: NecVersion) => string) },
  scenario: TScenario | null,
  answers: Record<string, number>,
  necVersion?: NecVersion
): string {
  if (typeof step.hint === "function") {
    return scenario ? step.hint(scenario, answers, necVersion) : "";
  }
  return step.hint;
}
