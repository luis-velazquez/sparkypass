// Conductor size parsing/encoding utilities

// Parse conductor size string to numeric code
// AWG sizes (1-14) stay as-is, /0 sizes use negative numbers, kcmil stays as-is
export function parseConductorInput(input: string): number {
  const trimmed = input.trim();
  if (trimmed === "1/0") return -1;
  if (trimmed === "2/0") return -2;
  if (trimmed === "3/0") return -3;
  if (trimmed === "4/0") return -4;
  const num = parseFloat(trimmed.replace(/,/g, ""));
  return isNaN(num) ? NaN : num;
}

// Convert conductor size string to numeric code (for expectedAnswer)
export function conductorSizeToCode(size: string): number {
  if (size === "1/0") return -1;
  if (size === "2/0") return -2;
  if (size === "3/0") return -3;
  if (size === "4/0") return -4;
  return parseFloat(size);
}

// Convert numeric code back to display string
export function conductorCodeToLabel(code: number): string {
  if (code === -1) return "1/0";
  if (code === -2) return "2/0";
  if (code === -3) return "3/0";
  if (code === -4) return "4/0";
  return `${code}`;
}
