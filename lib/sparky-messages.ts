import type { SparkyVariant } from "@/components/sparky/SparkyAvatar";
import type { UserClassification } from "@/types/reward-system";

interface SparkyReaction {
  message: string;
  variant: SparkyVariant;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Dashboard greetings by classification ---

const DASHBOARD_GREETINGS: Record<UserClassification, string[]> = {
  milliwatt_electrician: [
    "Welcome back! Every electrician starts at a trickle of current.",
    "Hey there! Let's build a solid foundation today.",
    "Good to see you! Every correct answer adds watts to your balance.",
  ],
  watt_electrician: [
    "Watt Electrician! The first thousand is the hardest — it's lit.",
    "Your bulb's glowing now. Keep feeding it current!",
    "1,000 lifetime watts down. The fundamentals are taking hold.",
  ],
  kilowatt_electrician: [
    "Kilowatt Electrician! The circuits are humming — keep it going.",
    "3,000 lifetime watts! Your NEC knowledge is building momentum.",
    "Impressive dedication! Time to push deeper into the code.",
  ],
  megawatt_electrician: [
    "Megawatt Electrician! You're handling high-voltage concepts with ease.",
    "Serious power now — the exam doesn't stand a chance!",
    "The NEC is becoming second nature. Keep the current flowing!",
  ],
  gigawatt_electrician: [
    "Gigawatt Electrician! You're running plant-level power.",
    "15,000 lifetime watts — your study habit is industrial-grade.",
    "The grid runs on discipline like yours. Keep it flowing!",
  ],
  terawatt_electrician: [
    "Terawatt Electrician! Transmission-line voltage. Respect.",
    "28,000 lifetime watts — you're carrying serious load.",
    "High-tension knowledge, safely grounded. Keep climbing!",
  ],
  petawatt_electrician: [
    "Petawatt Electrician! You strike like lightning now.",
    "48,000 lifetime watts — storm-level output!",
    "The code book fears you a little. As it should.",
  ],
  exawatt_electrician: [
    "Exawatt Electrician! Full-storm force. Incredible.",
    "75,000 lifetime watts — thunderhead territory!",
    "Few make it this far. The summit's in sight.",
  ],
  zettawatt_electrician: [
    "Zettawatt Electrician! Solar-scale output. Blinding.",
    "110,000 lifetime watts — you outshine the sun!",
    "One rank left. Total mastery is within reach.",
  ],
  yottawatt_electrician: [
    "Yottawatt Electrician! You ARE the code reference. Legendary!",
    "160,000 lifetime watts — maximum classification achieved.",
    "The summit. Maintain that edge, master!",
  ],
};

export function getDashboardGreeting(classification: UserClassification): SparkyReaction {
  const messages = DASHBOARD_GREETINGS[classification] || DASHBOARD_GREETINGS.milliwatt_electrician;
  return { message: pick(messages), variant: "default" };
}

// --- Streak milestones ---

const STREAK_CELEBRATIONS: Record<number, string[]> = {
  3: [
    "3-day streak! You're building a habit. Keep it going!",
    "Three days strong! Consistency is the key to passing.",
  ],
  5: [
    "5-day streak! You're on fire! The NEC is no match for this dedication!",
    "Five days in a row! Your commitment is electrifying!",
  ],
  7: [
    "ONE WEEK STREAK! Incredible discipline! You're a study machine!",
    "7 days straight! That's a full week of powering through the code!",
  ],
  10: [
    "10-DAY STREAK! You're absolutely unstoppable! Master Electrician energy!",
    "Double digits! Ten days of pure dedication. The exam should be worried!",
  ],
  14: [
    "TWO WEEK STREAK! Your consistency is legendary!",
    "14 days! You've built an unbreakable study habit!",
  ],
  21: [
    "THREE WEEKS! You are the definition of dedication!",
    "21-day streak — they say it takes 21 days to form a habit. You did it!",
  ],
  30: [
    "ONE MONTH STREAK! You are absolutely LEGENDARY!",
    "30 days straight! This level of commitment guarantees success!",
  ],
};

export function getStreakCelebration(streakDays: number): SparkyReaction | null {
  const milestones = [30, 21, 14, 10, 7, 5, 3];
  for (const milestone of milestones) {
    if (streakDays === milestone && STREAK_CELEBRATIONS[milestone]) {
      return { message: pick(STREAK_CELEBRATIONS[milestone]), variant: "excited" };
    }
  }
  return null;
}

// --- Circuit breaker reactions ---

export function getBreakerTripReaction(): SparkyReaction {
  return {
    message: pick([
      "Breaker tripped! Don't worry — use the cooldown to review the material, then try again.",
      "Oops! The circuit overloaded. Take a breather and come back stronger.",
      "Breaker's down! This is a learning moment. Review the concepts and reset when ready.",
    ]),
    variant: "warning",
  };
}

export function getBreakerClearReaction(streak: number): SparkyReaction {
  if (streak >= 10) {
    return {
      message: `${streak} in a row without tripping! You're a circuit breaker master!`,
      variant: "proud",
    };
  }
  if (streak >= 5) {
    return {
      message: `${streak}-answer streak! Your accuracy is rock solid. Keep it going!`,
      variant: "excited",
    };
  }
  return {
    message: "Good work clearing that question! Stay focused and keep the breaker running.",
    variant: "default",
  };
}

// --- Review reminders ---

export function getReviewReminder(dueCount: number): SparkyReaction {
  if (dueCount >= 20) {
    return {
      message: `You have ${dueCount} questions due for review! Your spaced repetition queue needs attention.`,
      variant: "warning",
    };
  }
  if (dueCount >= 5) {
    return {
      message: `${dueCount} questions are ready for review. A quick session will keep your knowledge sharp!`,
      variant: "thinking",
    };
  }
  return {
    message: `${dueCount} question${dueCount !== 1 ? "s" : ""} due for review. Let's reinforce what you've learned!`,
    variant: "default",
  };
}

// --- Classification advancement ---

const CLASSIFICATION_MESSAGES: Record<UserClassification, string> = {
  milliwatt_electrician: "Welcome to SparkyPass! Start studying to earn watts!",
  watt_electrician: "Watt Electrician! Your first 1,000 lifetime watts — the bulb is lit!",
  kilowatt_electrician: "Kilowatt Electrician! 3,000 lifetime watts — your dedication is paying off!",
  megawatt_electrician: "MEGAWATT ELECTRICIAN! 7,500 lifetime watts of NEC mastery!",
  gigawatt_electrician: "GIGAWATT ELECTRICIAN! 15,000 lifetime watts — plant-level power!",
  terawatt_electrician: "TERAWATT ELECTRICIAN! 28,000 lifetime watts — transmission-line voltage!",
  petawatt_electrician: "PETAWATT ELECTRICIAN! 48,000 lifetime watts — you strike like lightning!",
  exawatt_electrician: "EXAWATT ELECTRICIAN! 75,000 lifetime watts — full-storm force!",
  zettawatt_electrician: "ZETTAWATT ELECTRICIAN! 110,000 lifetime watts — solar-scale output!",
  yottawatt_electrician: "YOTTAWATT ELECTRICIAN! 160,000 lifetime watts — the ultimate electrician!",
};

export function getClassificationAdvancementMessage(classification: UserClassification): SparkyReaction {
  return {
    message: CLASSIFICATION_MESSAGES[classification] || "Classification advanced! Keep powering up!",
    variant: "proud",
  };
}

// --- Safety briefing (fast answer detection) ---

const SAFETY_BRIEFINGS: string[] = [
  "Whoa, that was fast! On the real exam, take a moment to read each question carefully.",
  "Speed is great, but accuracy matters more! Make sure you're reading the full question.",
  "Quick draw! Just remember — the exam rewards careful reading, not speed.",
  "That was lightning fast! Double-check: did you read all the answer choices?",
  "Slow down just a bit! Even experienced electricians re-read tricky NEC questions.",
];

export function getSafetyBriefing(): SparkyReaction {
  return { message: pick(SAFETY_BRIEFINGS), variant: "thinking" };
}

// --- Quiz encouragement by accuracy ---

export function getQuizEncouragement(accuracy: number): SparkyReaction {
  if (accuracy >= 90) {
    return {
      message: "Outstanding performance! You're ready to step up to a higher difficulty!",
      variant: "proud",
    };
  }
  if (accuracy >= 75) {
    return {
      message: "Solid results! A few more review sessions and you'll be even stronger.",
      variant: "excited",
    };
  }
  if (accuracy >= 60) {
    return {
      message: "Good effort! Focus on the topics you missed and try again.",
      variant: "default",
    };
  }
  return {
    message: "Every wrong answer is a learning opportunity. Review the explanations and try again — you'll improve!",
    variant: "calm",
  };
}

// --- Power grid status reactions ---

export function getPowerGridReaction(energized: number, total: number, flickering: number): SparkyReaction {
  const ratio = total > 0 ? energized / total : 0;

  if (ratio >= 0.8) {
    return {
      message: "Your power grid is glowing! Almost every circuit is fully energized. Master Electrician status!",
      variant: "proud",
    };
  }
  if (flickering > 0) {
    return {
      message: `${flickering} circuit${flickering !== 1 ? "s" : ""} flickering — recent wrong answers on topics you'd mastered. Time to review!`,
      variant: "warning",
    };
  }
  if (ratio >= 0.5) {
    return {
      message: "Good progress on your power grid! Keep energizing those remaining circuits.",
      variant: "default",
    };
  }
  return {
    message: "Most circuits are still de-energized. Start quizzing in different categories to light up the grid!",
    variant: "thinking",
  };
}
