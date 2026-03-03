import type { Step } from "react-joyride";

export const DASHBOARD_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="sparky-message"]',
    title: "Meet Sparky!",
    content:
      "I'm your study buddy! I'll give you tips here based on your progress.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="feature-quiz"]',
    title: "Quiz Mode",
    content:
      "Practice NEC questions across 15 categories. Earn Watts for correct answers!",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="feature-circuit-breaker"]',
    title: "Circuit Breaker",
    content:
      "High-stakes mode — 2 wrong answers trips the breaker! Can you keep it going?",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="feature-index-game"]',
    title: "Index Game",
    content:
      "Race to find NEC articles and sharpen your code book navigation speed!",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="stat-level-xp"]',
    title: "Voltage & Watts",
    content:
      "Track your voltage tier, Watts earned, amps level, and accuracy here. P = V × I!",
    placement: "top",
    disableBeacon: true,
  },
  {
    target: '[data-tour="stat-study-streak"]',
    title: "Study Streak",
    content:
      "See your streak and which topics need the most attention. Streaks boost your Amps!",
    placement: "top",
    disableBeacon: true,
  },
  {
    target: '[data-tour="stat-exam-countdown"]',
    title: "Exam Countdown",
    content:
      "Set your exam date and track how much of the question bank you've covered.",
    placement: "top",
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-desktop"]',
    title: "Navigation",
    content:
      "Jump between features anytime from here. Now go ace that exam!",
    placement: "bottom",
    disableBeacon: true,
  },
];

export const SETTINGS_TOUR_STEP: Step = {
  target: '[data-tour="quiz-preferences"]',
  title: "Quiz Preferences",
  content:
    "Customize your study sessions here! Turn on Journeyman or Master Focus Mode, change the number of questions per quiz, and toggle hints off on Master difficulty for an extra challenge.",
  placement: "top-start",
  disableBeacon: true,
  disableScrolling: true,
  data: { isTourEnd: true },
};
