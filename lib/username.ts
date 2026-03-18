// ─── Username validation ────────────────────────────────────────────────────

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const CONSECUTIVE_SPECIAL = /[_-]{2,}/;
const PURE_NUMBERS = /^\d+$/;

const RESERVED_WORDS = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "support",
  "help",
  "official",
  "sparkypass",
  "sparky",
  "system",
  "root",
  "staff",
  "team",
  "noreply",
  "null",
  "undefined",
  "test",
  "api",
  "www",
]);

const PROFANITY_PATTERNS = [
  /f+u+c+k+/i,
  /s+h+i+t+/i,
  /a+s+s+h+o+l+e/i,
  /b+i+t+c+h/i,
  /d+i+c+k/i,
  /p+u+s+s+y/i,
  /c+u+n+t/i,
  /n+i+g+g/i,
  /f+a+g+/i,
  /r+e+t+a+r+d/i,
  /w+h+o+r+e/i,
  /s+l+u+t/i,
];

export interface UsernameValidation {
  valid: boolean;
  error: string | null;
}

export function validateUsername(raw: string): UsernameValidation {
  const username = raw.trim();

  if (username.length === 0) {
    return { valid: false, error: "Username is required" };
  }

  if (username.length < USERNAME_MIN) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN} characters` };
  }

  if (username.length > USERNAME_MAX) {
    return { valid: false, error: `Username must be ${USERNAME_MAX} characters or less` };
  }

  if (!USERNAME_REGEX.test(username)) {
    if (!/^[a-zA-Z]/.test(username)) {
      return { valid: false, error: "Username must start with a letter" };
    }
    return { valid: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
  }

  if (CONSECUTIVE_SPECIAL.test(username)) {
    return { valid: false, error: "Username can't have consecutive underscores or hyphens" };
  }

  if (PURE_NUMBERS.test(username.replace(/[_-]/g, ""))) {
    return { valid: false, error: "Username must include at least one letter" };
  }

  if (RESERVED_WORDS.has(username.toLowerCase())) {
    return { valid: false, error: "That username is reserved" };
  }

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(username)) {
      return { valid: false, error: "That username is not allowed" };
    }
  }

  return { valid: true, error: null };
}

/** Normalize for storage and uniqueness comparison (lowercase, trimmed). */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Strip invalid characters for input sanitization (keeps casing). */
export function sanitizeUsernameInput(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "");
}

// ─── Fun suggestions ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "VoltageVince",
  "GroundedGary",
  "WattMaster",
  "CircuitQueen",
  "OhmMyGod",
  "SparkPlug",
  "AmpedUp",
  "WireWolf",
  "JunctionJay",
  "ConduitKing",
  "BreakerBoss",
  "ResistorRex",
  "CurrentChris",
  "FuseBox",
  "NeutralNinja",
  "PanelPro",
  "LiveWire",
  "GroundFault",
  "PhaseShifter",
  "CodeCrusher",
];

/** Return a few random username suggestions. */
export function getUsernameSuggestions(count = 3): string[] {
  const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
