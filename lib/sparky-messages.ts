import type { SparkyVariant } from "@/components/sparky/SparkyAvatar";
import type { VoltageTier } from "@/types/reward-system";

interface SparkyReaction {
  message: string;
  variant: SparkyVariant;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Dashboard greetings by voltage tier ---

const DASHBOARD_GREETINGS: Record<number, string[]> = {
  1: [
    "Welcome back, apprentice! Ready to learn the fundamentals?",
    "Hey there! Let's build a solid foundation today.",
    "Good to see you! Every question makes you stronger.",
  ],
  2: [
    "The circuits are humming! Let's keep that momentum going.",
    "You're making great progress through the code. Keep it up!",
    "120V and climbing! Time to push deeper into the NEC.",
  ],
  3: [
    "Journeyman territory! The training wheels are coming off.",
    "You're wired for success. Let's tackle some tougher material.",
    "240V — your knowledge is powering through. Stay sharp!",
  ],
  4: [
    "Journeyman status! The NEC is becoming second nature.",
    "277V — you're reading the code like a seasoned electrician.",
    "Impressive progress. Let's keep the current flowing strong.",
  ],
  5: [
    "Master Candidate! You're handling high-voltage concepts with ease.",
    "480V — the exam doesn't stand a chance against this preparation.",
    "You're operating at service entrance level. Push for mastery!",
  ],
  6: [
    "Master Electrician caliber! Your NEC knowledge is exceptional.",
    "600V — you can cite articles in your sleep. Almost there!",
    "The code is your language now. Let's perfect every detail.",
  ],
  7: [
    "The Transformer! You've reached the pinnacle. Maintain that edge.",
    "13.8kV — you ARE the code reference. Legendary dedication!",
    "Maximum voltage achieved. Your mastery is truly electrifying.",
  ],
};

export function getDashboardGreeting(voltageTier: VoltageTier): SparkyReaction {
  const tier = Math.min(Math.max(voltageTier, 1), 7);
  const messages = DASHBOARD_GREETINGS[tier] || DASHBOARD_GREETINGS[1];
  return { message: pick(messages), variant: "default" };
}

// --- Decay warnings (low amps) ---

const DECAY_WARNINGS: string[] = [
  "Your amps are dropping! Study today to keep your momentum up.",
  "I'm seeing some power loss in your circuit. Let's recharge with a quiz!",
  "Your activity meter is getting low. Even a quick 5-question set helps!",
  "Don't let the current die down — a daily challenge will boost your amps.",
  "Your study momentum is fading. Jump back in before your amps decay further!",
];

const DECAY_CRITICAL: string[] = [
  "Power levels critical! Your amps have dropped significantly. Study now to recover!",
  "Warning: circuit almost de-energized! Your study streak and amps need attention.",
  "Emergency! Your amps are at minimum levels. Even one quiz session will help restart the flow.",
];

export function getDecayWarning(currentAmps: number): SparkyReaction | null {
  if (currentAmps <= 15) {
    return { message: pick(DECAY_CRITICAL), variant: "warning" };
  }
  if (currentAmps <= 30) {
    return { message: pick(DECAY_WARNINGS), variant: "warning" };
  }
  return null;
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

// --- Voltage tier advancement ---

export function getTierAdvancementMessage(newTier: VoltageTier): SparkyReaction {
  const messages: Record<number, string> = {
    2: "You've advanced to 120V — Apprentice! Hints are still available, but you're proving yourself!",
    3: "240V — Journeyman Candidate! Hints are now hidden. Trust your knowledge!",
    4: "277V — Journeyman! Formulas are now hidden too. You know this material inside and out!",
    5: "480V — Master Candidate! NEC references are gone. You're citing from memory now!",
    6: "600V — Master Electrician! Article numbers hidden. You're writing the code at this point!",
    7: "13.8kV — THE TRANSFORMER! Full lockdown mode. You are the ultimate electrician!",
  };

  return {
    message: messages[newTier] || "Voltage tier advanced! Keep pushing higher!",
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

export function getQuizEncouragement(accuracy: number, voltageTier: VoltageTier): SparkyReaction {
  if (accuracy >= 90) {
    return {
      message: voltageTier >= 5
        ? "Outstanding performance! You're operating at peak voltage."
        : "Incredible accuracy! You're ready to step up to a higher difficulty!",
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
