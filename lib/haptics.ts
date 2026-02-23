type HapticPattern = "tap" | "medium" | "success" | "error" | "celebration";

const patterns: Record<HapticPattern, number | number[]> = {
  tap: 10,
  medium: 25,
  success: [15, 50, 30],
  error: [30, 30, 30, 30, 60],
  celebration: [20, 40, 20, 40, 80],
};

export function haptic(pattern: HapticPattern): void {
  try {
    navigator.vibrate?.(patterns[pattern]);
  } catch {
    // No-op — vibration not supported (iOS, desktop, etc.)
  }
}
