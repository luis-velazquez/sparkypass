import tipsData from "@/data/tips.json";
import type { Tip } from "@/types/tip";

const tips = tipsData.tips as Tip[];

export const TIP_ENABLED_KEY = "sparkypass-tip-enabled";
export const TIP_LAST_SHOWN_KEY = "sparkypass-tip-last-shown-date";

export function getTodayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getTodaysTip(): Tip {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return tips[seed % tips.length];
}
