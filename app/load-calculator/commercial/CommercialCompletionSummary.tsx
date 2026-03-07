export function CommercialCompletionSummary({
  serviceAmps,
}: {
  serviceAmps: number;
}) {
  return (
    <div className="border-t pt-2 mt-2">
      <div className="flex justify-between items-center font-semibold">
        <span className="text-foreground">Service Size</span>
        <span className="text-emerald dark:text-sparky-green text-lg">
          {serviceAmps}A
        </span>
      </div>
    </div>
  );
}
