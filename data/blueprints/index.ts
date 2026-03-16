import texasJourneyman from "./texas-journeyman.json";
import texasMaster from "./texas-master.json";
import type { ExamBlueprint } from "@/types/mock-exam";

export const BLUEPRINTS: Record<string, ExamBlueprint> = {
  "texas-journeyman": texasJourneyman as unknown as ExamBlueprint,
  "texas-master": texasMaster as unknown as ExamBlueprint,
};

export function getBlueprintById(id: string): ExamBlueprint | undefined {
  return BLUEPRINTS[id];
}

export function getAllBlueprints(): ExamBlueprint[] {
  return Object.values(BLUEPRINTS);
}
