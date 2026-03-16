// Shared Sparky message arrays and helpers for all quiz modes
// (daily challenge, category quiz, mock exam, circuit breaker)

/** Correct-answer congratulations */
export const CORRECT_MESSAGES = [
  "Excellent work! You're lighting up the path to success! ⚡",
  "That's the right answer! Your knowledge is really amping up!",
  "Perfect! You're wired for success, future Master Electrician!",
  "Brilliant! That's exactly right - you're on fire! 🔥",
  "Outstanding! Your understanding is crystal clear!",
  "You nailed it! Keep that current flowing!",
  "Correct! You're really charging ahead with these concepts!",
  "Yes! That's some high-voltage knowledge right there!",
  "Fantastic! Your electrical expertise is shining bright!",
  "Spot on! You're grounded in the fundamentals!",
];

/** Incorrect-answer encouragement */
export const INCORRECT_MESSAGES = [
  "Not quite, but that's how we learn! Let me help you understand this one.",
  "Close! This is a tricky one. Let's review it together.",
  "That's okay! Even master electricians were apprentices once. Here's the key insight:",
  "Don't worry! This concept trips up a lot of people. Let's break it down.",
  "Almost there! Understanding this will make you stronger for the exam.",
  "Learning moment! This is exactly why practice matters. Here's the explanation:",
  "No worries! These questions help identify areas to strengthen. Let's review:",
  "That's a tough one! Here's what the NEC says about this:",
];

/** Messages for streaks of STREAK_THRESHOLD+ correct in a row */
export const ON_FIRE_MESSAGES = [
  "YOU'RE ON FIRE! 🔥 3 in a row! Keep that hot streak going!",
  "BLAZING HOT! 🔥 You're absolutely crushing it right now!",
  "UNSTOPPABLE! 🔥 Your knowledge is burning bright!",
  "ELECTRIC FIRE! ⚡🔥 Nothing can stop you now!",
  "SCORCHING STREAK! 🔥 You're lighting up this quiz!",
];

/** Messages when a streak is broken */
export const STREAK_BROKEN_MESSAGES = [
  "Streak broken, but don't sweat it! Every master electrician has had setbacks. Let's build a new one! 💪",
  "That streak had a good run! Shake it off and let's start fresh - you've got this!",
  "No worries about the streak! What matters is you're learning. Ready to fire up a new one? 🔥",
  "The streak may be gone, but your knowledge isn't! Let's get back on track together.",
  "Hey, streaks are made to be broken... and rebuilt! You're still making progress!",
];

/** Big milestone celebration messages (category quiz / long sessions) */
export const MILESTONE_MESSAGES: Record<number, string[]> = {
  5: ["FIVE IN A ROW! You're heating up!", "5 STREAK! Now you're cooking with gas!"],
  10: ["TEN STREAK! Absolutely unstoppable!", "10 IN A ROW! You're on another level!"],
  15: ["FIFTEEN! Legendary performance!", "15 STREAK! Are you even human?!"],
  20: ["TWENTY! Master Electrician status!", "20 STREAK! Flawless!"],
};

/** Streak milestones that trigger special celebrations */
export const MILESTONES = [5, 10, 15, 20];

/** Number of consecutive correct answers to trigger "on fire" state */
export const STREAK_THRESHOLD = 3;

/** Pick a random message from an array */
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}
