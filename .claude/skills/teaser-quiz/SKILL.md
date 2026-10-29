---
name: teaser-quiz
description: Build or update the three teaser quizzes on sparkypass.com, using only questions QA has checked against the 2026 NEC, with instant feedback, a score screen and the App Store call to action. Use when building the quizzes, or when swapping or refreshing their questions.
---

# Teaser quizzes

Three short quizzes give visitors a taste of the app, then send them to the App Store. The proposed set, which Luis can change:

| Quiz | Page | Questions |
|---|---|---|
| Journeyman exam practice | `/practice/journeyman` | 5 |
| Master exam practice | `/practice/master` | 5 |
| 2026 NEC changes | `/practice/2026-nec-changes` | 5 |

## 1. Pick candidates

- Source: `data/questions/*.json`. Each question has `difficulty`, `calculation`, `necVersions`, `necReference`, and for some, `necReferences` per code cycle.
- Keep questions with `"2026"` in `necVersions` and `calculation: false`. No load-calculation questions (Art. 220, now Art. 120) until the load-calc fixes are live in the app.
- Skip questions that need a figure or table the site can't show.
- Mix easy and hard questions, and cover different articles.
- Pick 8 candidates per quiz so QA can reject some. List them in the pull request by `id`.

## 2. QA hold point

- **A-31** checks each answer, explanation and reference against the 2026 NEC and the PSI exam outline.
- **Luis** confirms any requirement that changed between 2023 and 2026.
- Only approved questions ship. Record each approval in `docs/website/quiz-approvals.md` with the question id, the date and who approved it.

## 3. Build

- One page per quiz. Render the question text on the server so Google can read it, and check answers in the browser.
- After each answer, show right or wrong, a short explanation in your own words, and the reference with its edition, such as "NEC 2026, 300.4(A)(1)".
- Score screen:
  - the score and one line on what it means
  - "The app has 500+ more questions, flashcards and timed mock exams"
  - the App Store badge, with a campaign link of `ct=quiz-<name>`
  - a QR code on desktop
- Accessibility: answers work with the keyboard, focus is visible, and the feedback is announced (`aria-live`).
- Tracking (see the plan in `docs/website/README.md`): `quiz_started`, `quiz_answered` (with `correct`), `quiz_finished` (with `score`) and `app_store_tap`.

## 4. Hand off

1. Run the `site-audit` checks.
2. Open a draft pull request with the approved question ids.
3. Ask for QA (HP1), then Luis (HP2).

## Refresh

Every month, or when the weekly review shows people dropping off at one question, swap in newly approved questions. Never change a question's wording without sending it back through QA.
