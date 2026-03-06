import type { CompletionResults } from "./types";

export function CompletionSummaryCard({
  results,
}: {
  results: CompletionResults;
}) {
  return (
    <div className="border-t pt-2 mt-2 space-y-1">
      <div className="flex justify-between items-center font-semibold">
        <span className="text-foreground">Service Size</span>
        <span className="text-emerald dark:text-sparky-green text-lg">
          {results.serviceAmps}A
        </span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Conductor (Cu)</span>
        <span className="text-emerald dark:text-sparky-green font-medium">
          {results.conductorSize} AWG/kcmil
        </span>
      </div>
      {results.aluminumConductorSize && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Conductor (Al)</span>
          <span className="text-sky-500 dark:text-sky-400 font-medium">
            {results.aluminumConductorSize} AWG/kcmil
          </span>
        </div>
      )}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">GEC</span>
        <span className="text-emerald dark:text-sparky-green font-medium">
          {results.gecSize} AWG
        </span>
      </div>
    </div>
  );
}
