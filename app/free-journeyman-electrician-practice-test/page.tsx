import Link from "next/link";
import { AppStoreBadge } from "@/components/site/AppStoreBadge";
import { JsonLd } from "@/components/site/JsonLd";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SparkyBubble } from "@/components/site/SparkyBubble";
import { TestCard } from "@/components/site/TestCard";
import { TESTS, TOTAL_FREE_QUESTIONS, testPath } from "@/lib/practice-tests";
import { pageMetadata } from "@/lib/seo";
import { NFPA_DISCLAIMER, PRACTICE_HUB_PATH, QUESTION_COUNT_LABEL, SITE_URL, TRIAL_DAYS } from "@/lib/site";

export const metadata = pageMetadata({
  title: `Free Journeyman Electrician Practice Test (${TOTAL_FREE_QUESTIONS} NEC Questions)`,
  absoluteTitle: true,
  description: `Free journeyman electrician practice test: ${TOTAL_FREE_QUESTIONS} NEC questions in three timed 20-question tests, every answer explained with the code section. No signup.`,
  path: PRACTICE_HUB_PATH,
  ogImage: `${PRACTICE_HUB_PATH}/opengraph-image`,
  ogImageAlt: "Free journeyman electrician practice test — 60 NEC questions with explanations",
});

const KNOWLEDGE_OUTLINE: [string, number][] = [
  ["Definitions, theory, and plans", 3],
  ["Services, service equipment, and separately derived systems", 6],
  ["Feeders", 3],
  ["Branch circuits and conductors", 10],
  ["Wiring methods and materials", 10],
  ["Equipment and devices", 10],
  ["Motors and generators", 5],
  ["Control devices and disconnecting means", 1],
  ["Special occupancies, equipment, and conditions", 6],
  ["Renewable energy technologies", 2],
];

const FAQ = [
  {
    q: "Do I need an account to take the free tests?",
    a: "No. The three tests run in your browser. Your answers are saved on this device so you can leave and come back; there is no account and no score to upload.",
  },
  {
    q: "Are these the same questions as in the app?",
    a: `Yes. All ${TOTAL_FREE_QUESTIONS} come from the SparkyPass journeyman bank, with the same explanations and Sparky tips. The app has the full ${QUESTION_COUNT_LABEL} bank across journeyman and master tiers.`,
  },
  {
    q: "Which NEC edition are the answers based on?",
    a: "Every question here is valid under both the 2023 and 2026 NEC. The code reference shows the 2023 section, and the 2026 section too whenever the number changed.",
  },
  {
    q: "What score should I be aiming for?",
    a: "Texas requires 70% on each portion of its exam, and most other states set the bar between 70% and 75%. Treat 14 of 20 as the floor and keep going until 17 or 18 feels routine.",
  },
  {
    q: "Can I use these for the master electrician exam?",
    a: "They are a solid warm-up, but the master exam asks more calculation questions (33 against 26 in Texas) and weights services and motors more heavily: service sizing, transformers, motors, and commercial load calculations. The app's master tier and load calculators cover that ground.",
  },
  {
    q: "Why do the answer choices move around?",
    a: "The choices are shuffled so you learn the rule, not the letter. Real exams do the same thing.",
  },
];

export default function PracticeHubPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "SparkyPass", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Free journeyman electrician practice test" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Free journeyman electrician practice tests",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: TESTS.length,
      itemListElement: TESTS.map((t) => ({
        "@type": "ListItem",
        position: t.number,
        name: `Journeyman electrician practice test ${t.number}: ${t.title}`,
        url: `${SITE_URL}${testPath(t.slug)}`,
      })),
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:pt-16">
        <nav aria-label="Breadcrumb" className="font-mono text-[12px] uppercase tracking-[0.14em] text-stone-600">
          <Link href="/" className="hover:text-foreground">SparkyPass</Link> <span aria-hidden="true">/</span> Free practice tests
        </nav>
        <SectionHeading
          as="h1"
          eyebrow={`${TOTAL_FREE_QUESTIONS} questions · 3 tests · no signup`}
          title="Free Journeyman Electrician Practice Test"
          lede={
            <>
              Three 20-question tests pulled straight from the SparkyPass question bank. Pick an answer and you get the
              explanation, the NEC section for both the 2023 and 2026 editions, and Sparky&apos;s tip, exactly as you would
              in the app. The clock starts with your first answer so you can measure your pace against the exam.
            </>
          }
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTS.map((t) => (
            <TestCard key={t.slug} test={t} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-14 text-[16px] leading-relaxed text-stone-700 sm:text-[17px]">
          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">How these tests work</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>Twenty multiple-choice questions per test, four choices each, the same format as the state exams.</li>
              <li>You get feedback the moment you commit: correct or not, the explanation, and the code section.</li>
              <li>Answer choices are shuffled, and your correct answers are counted as you go.</li>
              <li>A running clock starts with your first answer. At the end you see your average pace next to the app&apos;s three-minute-per-question target (Texas gives about 2:12 per knowledge question and 4:14 per calculation).</li>
              <li>Your attempt is saved in this browser, so you can finish later or reset and try again.</li>
              <li>Test 3 is calculation-heavy on purpose. Keep a calculator handy; Texas allows a non-programmable one in the room.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">What is on the journeyman electrician exam</h2>
            <p className="mt-4">
              Every state writes its own licensing rules, but the exam itself is a test of the National Electrical Code.
              You are asked to find and apply the rule: burial depth for a direct-buried cable, the grounding electrode
              conductor for a 200-ampere service, the demand factor for sixteen dryers, the overload setting for a motor
              with a 1.0 service factor. Most of the questions are lookups; a smaller share are calculations that use the
              tables you look up.
            </p>
            <p className="mt-4">
              Texas publishes its outline, and it is a fair picture of what other states ask too. The NEC knowledge
              portion of the Texas journeyman exam scores 56 questions spread like this:
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
              <table className="w-full text-left text-[15px]">
                <thead className="bg-cream-dark font-mono text-[12px] uppercase tracking-[0.12em] text-stone-600">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Content area</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Scored items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {KNOWLEDGE_OUTLINE.map(([area, n]) => (
                    <tr key={area}>
                      <td className="px-4 py-2.5">{area}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[13px] text-stone-600">
              Source: PSI Candidate Information Bulletin for Texas electricians (updated September 2026). A separate
              24-question calculations portion is scored on its own.{" "}
              <Link href="/texas-journeyman-electrician-practice-test" className="font-semibold text-amber-text underline-offset-4 hover:underline">
                Texas details →
              </Link>
            </p>
            <p className="mt-4">
              Our three tests are themed to match: test 1 covers the general rules and wiring methods, test 2 covers
              services, grounding, and branch circuits, and test 3 concentrates the calculations, motors, and special
              occupancies.
            </p>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">Exam format and passing score</h2>
            <p className="mt-4">
              Formats vary by state, so check your own licensing board. The common shape: a multiple-choice, open-book
              exam delivered at a testing center, somewhere between 60 and 100 questions, with a passing score of 70%
              to 75%. Texas, for example, splits the journeyman exam into an NEC knowledge portion (56 scored questions
              in 130 minutes) and a calculations portion (24 scored questions in 110 minutes), and you need 70% on each.
            </p>
            <p className="mt-4">
              Open book is the detail that changes how you study. You are not memorizing the Code; you are learning
              where things live in it and how to read a table under time pressure. That is why every SparkyPass
              explanation names the section.
            </p>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">How to use the code book under time pressure</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                Learn the chapter map before you learn the sections. Chapter 2 is wiring and protection (210, 230, 250, and
                load calculations in Article 220, which the 2026 book moves to Article 120), Chapter 3 is wiring methods and materials (300, 310, 314, 358), Chapter 4 is equipment (408, 410,
                430, 450), Chapters 5 through 7 are special occupancies, equipment, and conditions, and Chapter 9 holds the
                tables for conduit fill and conductor properties.
              </li>
              <li>
                Start from the index, not the table of contents. The index points you to a section number; the table of
                contents only gets you to an article.
              </li>
              <li>
                Know your tables cold: Table 310.16 for ampacity, Table 250.66 for the grounding electrode conductor,
                Table 250.122 for the equipment grounding conductor, Table 220.55 (Table 120.55 in the 2026 NEC) for ranges,
                Table 314.16(A) and (B) for box fill, and Chapter 9 Tables 1, 4, 5, and 8 for raceway fill and conductor properties.
              </li>
              <li>
                Tab the book the way your state allows. Texas permits publisher-made permanent tabs, highlighting, and
                notes written before the exam, but not loose paper or the NEC Handbook.
              </li>
              <li>
                Budget your time. Three minutes a question is a useful average. If a lookup stalls, mark it and move
                on; the calculations at the end need the minutes more.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">How to study for it</h2>
            <p className="mt-4">
              Take the three free tests cold, then read every explanation, including the ones you got right. Note which
              code sections keep coming up. Then practice by topic until the lookups are fast, and save the calculations
              for last, because they are the easiest to improve with repetition. Candidates who pass tend to describe the
              exam as a navigation test, and navigation is a skill you drill.
            </p>
            <p className="mt-4">
              The SparkyPass app takes it from there: {QUESTION_COUNT_LABEL} questions by topic and difficulty, residential
              and commercial load calculators that walk through every step, a Calc Trainer that generates fresh numbers
              every time, and a Progress Report that tracks your pace. There is a {TRIAL_DAYS}-day free trial.
            </p>
            <div className="-ml-3 mt-4">
              <AppStoreBadge height={48} placement="hub" />
            </div>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">Frequently asked</h2>
            <div className="mt-5 divide-y divide-border rounded-3xl border border-border bg-white">
              {FAQ.map((item) => (
                <details key={item.q} className="faq px-6 py-5">
                  <summary className="flex items-center justify-between gap-4 font-display text-[17px] font-bold text-foreground">
                    <span>{item.q}</span>
                    <svg className="faq-chevron h-5 w-5 shrink-0 text-stone-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-stone-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          <SparkyBubble pose="thinking" size="md">
            <p>
              Pick the test that scares you most and start there. Missing a question here costs nothing; failing a portion
              on exam day costs $78 and another trip to the test center.
            </p>
          </SparkyBubble>

          <p className="text-[13px] leading-relaxed text-stone-600">{NFPA_DISCLAIMER}</p>
        </div>
      </section>
    </>
  );
}
