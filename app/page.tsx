import Link from "next/link";
import { HeroQuestion } from "@/components/practice/HeroQuestion";
import { AppStoreBadge } from "@/components/site/AppStoreBadge";
import { CircuitPattern } from "@/components/site/CircuitPattern";
import { JsonLd } from "@/components/site/JsonLd";
import { PhoneShot } from "@/components/site/PhoneShot";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SparkyBubble } from "@/components/site/SparkyBubble";
import { TestCard } from "@/components/site/TestCard";
import { TESTS, testPath } from "@/lib/practice-tests";
import { pageMetadata } from "@/lib/seo";
import {
  APP_STORE_URL,
  FREE_QUESTION_COUNT,
  MIN_IOS,
  NFPA_DISCLAIMER,
  PRACTICE_HUB_PATH,
  PRO_PRICE,
  QUESTION_COUNT_LABEL,
  SITE_URL,
  SUBSCRIPTION_DISCLOSURE,
  SUPPORT_EMAIL,
  TRIAL_DAYS,
} from "@/lib/site";

export const metadata = pageMetadata({
  title: "SparkyPass: Electrician Exam Prep App for the NEC",
  absoluteTitle: true,
  description:
    "Electrician exam prep on iPhone: 550+ NEC practice questions explained with the code section, load calculators, and study games. 60 free questions, no signup.",
  path: "/",
});

const FEATURE_ROWS = [
  {
    shot: "/screenshots/1-quiz.png",
    alt: "SparkyPass quiz screen showing a journeyman question about PVC expansion fittings with four answer choices and the 2023 NEC 352.44 reference",
    title: "Practice quizzes that cite the code section",
    body: "Quiz by topic, difficulty, and question type. Journeyman mode keeps hints and code references on; Master mode is exam conditions. Pick the 2023 or 2026 NEC and the references follow. Timed mode when you want the clock running.",
  },
  {
    shot: "/screenshots/2-load-calculator.png",
    alt: "SparkyPass load calculator walking through the general lighting load for an apartment with Sparky explaining the VA per square foot rule",
    title: "Load calculators that walk you through every step",
    body: "Residential and commercial service calculations the way the exam asks them: general lighting, appliances, HVAC versus heat, motor loads, demand factors. Nine dwellings and four commercial buildings, each a different scenario, with Sparky coaching the step you are on.",
  },
  {
    shot: "/screenshots/3-wall-of-fame.png",
    alt: "SparkyPass Wall of Fame showing most-missed questions as wanted posters",
    title: "Wall of Fame",
    body: "The questions you keep missing become wanted posters. Beat one twice in a row to take it down. It works offline and it is oddly motivating.",
  },
  {
    shot: "/screenshots/4-progress-report.png",
    alt: "SparkyPass progress report with study time, average pace versus the exam budget, a report card grade, and the last five quizzes",
    title: "Progress Report",
    body: "Study time today and this week, your last five quizzes, a report-card grade, and your average pace against a three-minute-per-question budget.",
  },
  {
    shot: "/screenshots/5-index-trace.png",
    alt: "SparkyPass Index Trace game asking the player to find the 2026 NEC reference for a garage circuit before the timer runs out",
    title: "Index Trace",
    body: "A fast-paced game that burns code references into memory: twenty rounds, three lives, find the right NEC reference before the timer runs out. The faster you can find it in the book, the more time you keep for the hard questions.",
  },
];

const TOOLBOX = [
  { title: "Daily Challenge", body: "Five questions a day drawn from the whole bank, with a streak calendar." },
  { title: "Drill Weak Spots", body: "Focused practice on the questions you miss most." },
  { title: "Porta Jon Challenge", body: "Three quick questions on your break, every two hours. Hold the throne." },
  { title: "Calc Trainer", body: "Fresh numbers every time: ampacity and derating, conduit fill, box fill, motor calcs, demand factors." },
  { title: "Formulas & Scratch Pad", body: "Ohm's law wheel, voltage drop, motor sizing, reference tables, and a built-in calculator one tap away." },
  { title: "Saved questions & flashcards", body: "Save any question and flip through your own deck." },
  { title: "Streaks & Watts", body: "Earn Watts for every correct answer and climb from Milliwatt to Yottawatt Electrician." },
];

const FAQ = [
  {
    q: "Is SparkyPass free?",
    a: `The app is free to download and comes with a ${TRIAL_DAYS}-day free trial of everything. After the trial, SparkyPass Pro is ${PRO_PRICE} a month. The ${FREE_QUESTION_COUNT} practice questions on this site are free with no account at all.`,
  },
  {
    q: "Which NEC editions does it cover?",
    a: "The 2023 and 2026 editions. Choose your edition in the app and every quiz code reference follows it.",
  },
  {
    q: "Is it for the journeyman exam or the master exam?",
    a: "Both. The question bank has journeyman and master tiers. Journeyman mode keeps hints and code references on while you learn; Master mode hides the help so you practice under exam conditions.",
  },
  {
    q: "Which states does it work for?",
    a: "The NEC is national, and SparkyPass teaches the code rather than one state's paperwork. The app measures your pace against a three-minute-per-question target. The app is available on the United States App Store.",
  },
  {
    q: "Does it work without a signal?",
    a: "The question bank is stored on your phone, so you can practice without service. Your progress syncs when you are back online.",
  },
  {
    q: "Is there an Android version?",
    a: `Not yet. SparkyPass is an iPhone app and requires iOS ${MIN_IOS} or later.`,
  },
  {
    q: "How do I cancel?",
    a: "In your App Store subscription settings, any time. Your access continues until the end of the period you already paid for.",
  },
  {
    q: "Is SparkyPass affiliated with the NFPA?",
    a: NFPA_DISCLAIMER,
  },
];

export default function HomePage() {
  const heroQuestion = TESTS[0].questions[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "SparkyPass",
      legalName: "SparkyPass LLC",
      url: SITE_URL,
      logo: `${SITE_URL}/app-icon-512.png`,
      email: SUPPORT_EMAIL,
      sameAs: [APP_STORE_URL],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "SparkyPass",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      name: "SparkyPass",
      alternateName: "SparkyPass: Electrician Exam Prep",
      description:
        "Electrician exam prep for the NEC: 550+ journeyman and master practice questions explained answer by answer with the code section, residential and commercial load calculators, and study games.",
      operatingSystem: `iOS ${MIN_IOS} or later`,
      applicationCategory: "EducationalApplication",
      installUrl: APP_STORE_URL,
      downloadUrl: APP_STORE_URL,
      image: `${SITE_URL}/app-icon-512.png`,
      author: { "@id": `${SITE_URL}/#organization` },
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free download" },
        {
          "@type": "Offer",
          name: "SparkyPass Pro Monthly",
          price: "14.99",
          priceCurrency: "USD",
          description: `${TRIAL_DAYS}-day free trial, then ${PRO_PRICE} per month, auto-renewing`,
        },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 text-amber opacity-60" aria-hidden="true">
          <CircuitPattern />
        </div>
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber/15 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="animate-rise font-mono text-[12px] uppercase tracking-[0.18em] text-amber-text">Electrician exam prep · iPhone</p>
            <h1 className="animate-rise rise-1 mt-4 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.025em] text-foreground sm:text-5xl lg:text-[3.6rem]">
              Pass your journeyman or master electrician exam.
            </h1>
            <p className="animate-rise rise-2 mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
              SparkyPass is an iPhone app with {QUESTION_COUNT_LABEL} NEC practice questions, each explained answer by
              answer with the exact code section. Load calculators, study games, and a {TRIAL_DAYS}-day free trial.
            </p>
            <div className="animate-rise rise-3 -ml-3 mt-6 flex flex-wrap items-center gap-x-2 gap-y-3">
              <AppStoreBadge height={56} placement="hero" />
              <Link href={PRACTICE_HUB_PATH} className="text-[16px] font-bold text-amber-text underline-offset-4 hover:underline">
                Try {FREE_QUESTION_COUNT} questions free →
              </Link>
            </div>
            <dl className="animate-rise rise-4 mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
              {[
                ["Questions", QUESTION_COUNT_LABEL],
                ["NEC editions", "2023 · 2026"],
                ["Free trial", `${TRIAL_DAYS} days`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone-600">{k}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="animate-rise rise-2">
            <HeroQuestion q={heroQuestion} testHref={testPath(TESTS[0].slug)} />
          </div>
        </div>
      </section>

      {/* ---------------- Why ---------------- */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[auto_1fr] md:items-center">
          <p className="font-display text-6xl font-extrabold leading-none tracking-tight text-foreground">
            1<span className="text-amber-dark"> in </span>4
          </p>
          <div>
            <p className="text-lg leading-relaxed text-stone-700">
              In fiscal 2025, only 24% of attempts at the Texas journeyman NEC knowledge exam passed, and 21% of
              calculations attempts. Open book does not mean easy. The difference is knowing where the answer lives
              and why it is the answer — which is exactly what every SparkyPass explanation teaches.
            </p>
            <p className="mt-2 text-[13px] text-stone-600">
              Source: Texas Department of Licensing and Regulation, FY2025 electrician exam statistics.{" "}
              <Link href="/texas-journeyman-electrician-practice-test" className="font-semibold text-amber-text underline-offset-4 hover:underline">
                Texas exam details →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="bg-cream-dark py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="What's in the app"
            title="Built for the way the exam asks."
            lede="Five screens from the App Store listing, exactly as they ship. No mock-ups."
          />
          <div className="mt-14 space-y-20">
            {FEATURE_ROWS.map((row, i) => (
              <div
                key={row.title}
                className={`grid items-center gap-10 ${i % 2 === 1 ? "md:grid-cols-[1fr_260px] md:[&>*:first-child]:order-2" : "md:grid-cols-[260px_1fr]"}`}
              >
                <PhoneShot src={row.shot} alt={row.alt} className="mx-auto w-[220px] sm:w-[260px]" />
                <div className="max-w-xl">
                  <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-stone-600">0{i + 1}</p>
                  <h3 className="mt-2 font-display text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-3xl">{row.title}</h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-stone-600 sm:text-[17px]">{row.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20">
            <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">And the rest of the toolbox</h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLBOX.map((t) => (
                <li key={t.title} className="rounded-2xl border border-border bg-white p-5 shadow-card">
                  <p className="font-display text-[17px] font-bold text-foreground">{t.title}</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-stone-600">{t.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- Free tests ---------------- */}
      <section id="free-tests" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Free practice tests"
            title={`${FREE_QUESTION_COUNT} journeyman questions. No signup.`}
            lede="Three 20-question tests pulled straight from the app's bank. Every answer is explained with the code section for both the 2023 and 2026 NEC, and the clock shows your pace against the exam."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTS.map((t) => (
              <TestCard key={t.slug} test={t} />
            ))}
          </div>
          <p className="mt-6 text-[15px] text-stone-600">
            <Link href={PRACTICE_HUB_PATH} className="font-bold text-amber-text underline-offset-4 hover:underline">
              About the free tests and the journeyman exam →
            </Link>
          </p>
        </div>
      </section>

      {/* ---------------- Sparky ---------------- */}
      <section className="border-y border-border bg-white py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SparkyBubble pose="vest" size="lg">
            <p>
              Hey, future journeyman. I&apos;m Sparky. I show up in the app when you miss a question, when a load
              calc needs a nudge, and when you get three in a row. Every explanation ends with the code section, so
              on exam day you know exactly where to flip.
            </p>
          </SparkyBubble>
        </div>
      </section>

      {/* ---------------- Pro ---------------- */}
      <section id="pro" className="relative overflow-hidden bg-stone-950 py-20 text-white">
        <div className="absolute inset-0 text-amber opacity-30" aria-hidden="true">
          <CircuitPattern id="circuit-dark" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-start">
            <SectionHeading
              light
              eyebrow="SparkyPass Pro"
              title="Everything in the app, after a free week."
              lede={`Download SparkyPass, create an account, and the whole app is open for ${TRIAL_DAYS} days. If it earns its place in your routine, Pro is ${PRO_PRICE} a month after that. Cancel anytime in your App Store settings.`}
            />
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-amber">What Pro includes</p>
              <ul className="mt-4 space-y-3 text-[16px] leading-relaxed text-stone-200">
                {[
                  `The full ${QUESTION_COUNT_LABEL} question bank, explained answer by answer`,
                  "Every load calculator, Index Trace pack, and study game",
                  "Daily challenges, streaks, and your review Power Grid",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-sparky-green" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold tracking-tight">{PRO_PRICE}</span>
                <span className="text-stone-400">/ month after a {TRIAL_DAYS}-day free trial</span>
              </div>
              <div className="-ml-3 mt-4">
                <AppStoreBadge height={52} placement="pro" />
              </div>
            </div>
          </div>
          <p className="mt-10 max-w-3xl text-[13px] leading-relaxed text-stone-400">
            {SUBSCRIPTION_DISCLOSURE} Available on the United States App Store. Requires an iPhone with iOS {MIN_IOS} or
            later.
          </p>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="Questions" title="Frequently asked" />
          <div className="mt-8 divide-y divide-border rounded-3xl border border-border bg-white">
            {FAQ.map((item) => (
              <details key={item.q} className="faq group px-6 py-5">
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
      </section>
    </>
  );
}
