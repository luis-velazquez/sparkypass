import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  as: Heading = "h2",
  light = false,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  light?: boolean;
}) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      <p className={`font-mono text-[12px] uppercase tracking-[0.18em] ${light ? "text-amber" : "text-amber-text"}`}>{eyebrow}</p>
      <Heading
        className={`mt-3 font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-4xl ${light ? "text-white" : "text-foreground"}`}
      >
        {title}
      </Heading>
      {lede ? <p className={`mt-4 text-[17px] leading-relaxed ${light ? "text-stone-300" : "text-stone-600"}`}>{lede}</p> : null}
    </div>
  );
}
