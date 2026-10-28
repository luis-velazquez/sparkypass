/**
 * The code-reference chip: the same mono amber label the app prints above a
 * question ("2023 NEC 352.44"). Used as the site's structural device wherever
 * a claim is backed by a section number. Theory questions whose "reference"
 * is a formula get a single "Formula" chip instead of an edition label.
 */
export function isCodeReference(ref: string): boolean {
  return /^(\d|Table|Article|Chapter|Annex|Informative)/i.test(ref.trim());
}

export function CodeRef({
  ref2023,
  ref2026,
  className = "",
}: {
  ref2023: string;
  ref2026?: string;
  className?: string;
}) {
  const chip = "rounded-md bg-amber-lighter px-2 py-1 text-amber-text";
  const label = "text-stone-600";
  const base = `inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12px] leading-none tracking-tight ${className}`;

  if (!isCodeReference(ref2023)) {
    return (
      <span className={base}>
        <span className={chip}>
          <span className={label}>Formula</span> {ref2023}
        </span>
      </span>
    );
  }

  const differs = ref2026 && ref2026 !== ref2023;
  return (
    <span className={base}>
      <span className={chip}>
        <span className={label}>2023 NEC</span> {ref2023}
      </span>
      {differs ? (
        <span className={chip}>
          <span className={label}>2026 NEC</span> {ref2026}
        </span>
      ) : null}
    </span>
  );
}
