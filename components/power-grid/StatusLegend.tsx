"use client";

export function StatusLegend() {
  const statuses = [
    {
      label: "Energized",
      color: "bg-emerald dark:bg-sparky-green",
      glow: "shadow-[0_0_6px_rgba(16,185,129,0.4)] dark:shadow-[0_0_6px_rgba(163,255,0,0.3)]",
      description: "75%+ accuracy, 10+ questions, SRS health >70%",
    },
    {
      label: "Browned Out",
      color: "bg-amber",
      glow: "",
      description: "50-75% accuracy or SRS health 30-70%",
    },
    {
      label: "Flickering",
      color: "bg-amber animate-pulse",
      glow: "",
      description: "Recent wrong answer on previously mastered topic",
    },
    {
      label: "De-energized",
      color: "bg-stone-400 dark:bg-stone-600",
      glow: "",
      description: "Not yet attempted or <5 questions",
    },
  ];

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {statuses.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${s.color} ${s.glow}`} />
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{s.label}</span>
            {" — "}
            {s.description}
          </span>
        </div>
      ))}
    </div>
  );
}
