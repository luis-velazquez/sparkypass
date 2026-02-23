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
      "Practice NEC questions across 12 categories. Earn XP for correct answers!",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="feature-flashcards"]',
    title: "Flashcards",
    content:
      "Memorize formulas and code references. Bookmark cards to review later!",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="feature-load-calculator"]',
    title: "Load Calculator",
    content:
      "Practice residential and commercial load calculations step by step.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="feature-mock-exam"]',
    title: "Mock Exam",
    content:
      "Simulate the real exam with timed tests to see if you're ready!",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="feature-daily-challenge"]',
    title: "Daily Challenge",
    content:
      "Complete daily challenges to build your streak and earn bonus XP!",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="stat-level-xp"]',
    title: "Level & XP",
    content:
      "Track your level, XP, accuracy, and SparkyBank coins here.",
    placement: "top",
    disableBeacon: true,
  },
  {
    target: '[data-tour="stat-study-streak"]',
    title: "Study Streak",
    content:
      "See your streak and which topics need the most attention.",
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
