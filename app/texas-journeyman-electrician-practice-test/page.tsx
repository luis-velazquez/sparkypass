import Link from "next/link";
import { AppStoreBadge } from "@/components/site/AppStoreBadge";
import { JsonLd } from "@/components/site/JsonLd";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SparkyBubble } from "@/components/site/SparkyBubble";
import { TestCard } from "@/components/site/TestCard";
import { TESTS } from "@/lib/practice-tests";
import { pageMetadata } from "@/lib/seo";
import { NFPA_DISCLAIMER, PRACTICE_HUB_PATH, QUESTION_COUNT_LABEL, SITE_URL, TRIAL_DAYS } from "@/lib/site";

const PATH = "/texas-journeyman-electrician-practice-test";

export const metadata = pageMetadata({
  title: "Texas Journeyman Electrician Practice Test (TDLR, 2026)",
  absoluteTitle: true,
  description:
    "Texas journeyman electrician exam facts from TDLR and PSI: two portions, 70% to pass, open book on the 2026 NEC, $78 fee. Plus 60 free practice questions.",
  path: PATH,
  ogImage: `${PATH}/opengraph-image`,
  ogImageAlt: "Texas journeyman electrician practice test and TDLR exam guide",
});

/* Every figure on this page was verified on 2026-10-27 against TDLR pages and the
   PSI Candidate Information Bulletin for Texas electricians (updated 9/15/2026). */
const SOURCES = [
  { label: "TDLR — Electrician exam information", href: "https://www.tdlr.texas.gov/electricians/elecexam.htm" },
  { label: "PSI — Texas electrician Candidate Information Bulletin (updated 9/15/2026)", href: "https://test-takers.psiexams.com/api/content/bulletin/1682" },
  { label: "TDLR — Commission adopts the 2026 NEC (effective Sept 1, 2026)", href: "https://www.tdlr.texas.gov/news/rulemaking/2026/09/01/commission-adopts-rules-12/" },
  { label: "TDLR — Journeyman electrician license requirements", href: "https://www.tdlr.texas.gov/electricians/apply/individuals/journeyman-electrician.htm" },
  { label: "TDLR — Master electrician license requirements", href: "https://www.tdlr.texas.gov/electricians/apply/individuals/master-electrician.htm" },
  { label: "TDLR — Electrician exam statistics, FY2025", href: "https://www.tdlr.texas.gov/electricians/elecExamStats2025.htm" },
];

const KNOWLEDGE: [string, number][] = [
  ["Definitions, theory, and plans", 3],
  ["Electrical services, service equipment, and separately derived systems", 6],
  ["Electrical feeders", 3],
  ["Branch circuits and conductors", 10],
  ["Electrical wiring methods and electrical materials", 10],
  ["Electrical equipment and devices", 10],
  ["Motors and generators", 5],
  ["Electrical control devices and disconnecting means", 1],
  ["Special occupancies, equipment, and conditions", 6],
  ["Renewable energy technologies", 2],
];

const CALCULATIONS: [string, number][] = [
  ["Calculations and theory", 2],
  ["Electrical services, service equipment, and separately derived systems", 4],
  ["Electrical feeders", 3],
  ["Branch circuit calculations and conductors", 4],
  ["Electrical wiring methods and electrical materials", 2],
  ["Electrical equipment and devices", 2],
  ["Motors and generators", 2],
  ["Electrical control devices and disconnecting means", 1],
  ["Special occupancies, equipment, and conditions", 3],
  ["Renewable energy technologies", 1],
];

function OutlineTable({ caption, rows }: { caption: string; rows: [string, number][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full text-left text-[15px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-cream-dark font-mono text-[12px] uppercase tracking-[0.12em] text-stone-600">
          <tr>
            <th scope="col" className="px-4 py-2.5">Content area</th>
            <th scope="col" className="px-4 py-2.5 text-right">Scored</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(([area, n]) => (
            <tr key={area}>
              <td className="px-4 py-2.5">{area}</td>
              <td className="px-4 py-2.5 text-right font-mono">{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TexasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SparkyPass", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Free journeyman electrician practice test", item: `${SITE_URL}${PRACTICE_HUB_PATH}` },
      { "@type": "ListItem", position: 3, name: "Texas journeyman electrician exam" },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:pt-16">
        <nav aria-label="Breadcrumb" className="font-mono text-[12px] uppercase tracking-[0.14em] text-stone-600">
          <Link href="/" className="hover:text-foreground">SparkyPass</Link> <span aria-hidden="true">/</span>{" "}
          <Link href={PRACTICE_HUB_PATH} className="hover:text-foreground">Free practice tests</Link> <span aria-hidden="true">/</span> Texas
        </nav>
        <SectionHeading
          as="h1"
          eyebrow="TDLR · PSI · 2026 NEC"
          title="Texas Journeyman Electrician Practice Test"
          lede="How the Texas journeyman exam is built right now, what it takes to sit for it, and sixty free NEC questions to find out where you stand. Figures below come from TDLR and the current PSI candidate bulletin; confirm them when you schedule."
        />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-14 text-[16px] leading-relaxed text-stone-700 sm:text-[17px]">
          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">The exam at a glance</h2>
            <p className="mt-4">
              The Texas Department of Licensing and Regulation licenses electricians and contracts PSI to deliver the
              exams at centers across the state. Since March 11, 2025, the journeyman exam has been two separately
              scored portions. You must pass each one.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { name: "NEC Knowledge portion", items: "59 questions (56 scored)", time: "130 minutes", pass: "70%" },
                { name: "Calculations portion", items: "26 questions (24 scored)", time: "110 minutes", pass: "70%" },
              ].map((p) => (
                <div key={p.name} className="rounded-2xl border border-border bg-white p-5 shadow-card">
                  <p className="font-display text-lg font-bold text-foreground">{p.name}</p>
                  <dl className="mt-3 space-y-1.5 text-[15px]">
                    {[
                      ["Questions", p.items],
                      ["Time", p.time],
                      ["To pass", p.pass],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="text-stone-600">{k}</dt>
                        <dd className="font-mono font-bold text-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <ul className="mt-5 list-disc space-y-2 pl-5">
              <li>Multiple choice, open book. Unscored pilot questions are mixed in and their time is already included.</li>
              <li>Exam fee: $78 for both portions. If you fail a portion, the retake fee is $78.</li>
              <li>Time does not roll over from one portion to the other.</li>
              <li>Unless a question says otherwise, all conductors are copper.</li>
              <li>Available in English and Spanish at no extra cost.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">Which code book</h2>
            <p className="mt-4">
              Texas adopted the 2026 National Electrical Code as the state electrical code effective September 1, 2026,
              and the exams were republished against the 2026 edition on the same date. Before that, exams referenced
              the 2023 NEC from October 2023. SparkyPass covers both editions, and every free question on this site
              shows the 2026 section number wherever it changed.
            </p>
            <h3 className="mt-6 font-display text-lg font-bold text-foreground">Open-book rules worth knowing</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Any soft-bound edition of the NEC is allowed. Loose-leaf, spiral-bound, and ring-bound copies are not.</li>
              <li>Highlighting, underlining, and notes are fine if they were made before the exam. You may not mark the book during the session.</li>
              <li>Permanent index tabs made or provided by the NEC publisher are allowed. Homemade tabs are not.</li>
              <li>No loose paper, taped or stapled, and no NEC Handbook.</li>
              <li>Calculators must be silent, non-programmable, battery-powered, without a printer or an alphabet keyboard.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">What the journeyman exam covers</h2>
            <p className="mt-4">The scored content outline, straight from the candidate bulletin.</p>
            <div className="mt-5 space-y-6">
              <div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">NEC Knowledge portion, 56 scored</h3>
                <OutlineTable caption="Texas journeyman NEC knowledge portion content outline" rows={KNOWLEDGE} />
              </div>
              <div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">Calculations portion, 24 scored</h3>
                <OutlineTable caption="Texas journeyman calculations portion content outline" rows={CALCULATIONS} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">Who can sit for it</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>8,000 hours of on-the-job training under a Texas-licensed master electrician for the license. You can apply and test once you have 7,000 hours.</li>
              <li>A $30 non-refundable application fee to TDLR, then one year from the date TDLR receives your application to pass.</li>
              <li>You may retake as many times as needed inside that year; each attempt carries the exam fee.</li>
              <li>Licenses are valid for one year and renewed annually.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">How hard is it</h2>
            <p className="mt-4">
              Harder than the pass mark suggests. In fiscal 2025, TDLR reported 1,402 passes out of 5,731 attempts on the
              journeyman NEC knowledge exam, a 24% pass rate, and 1,301 of 6,328 on the calculations exam, about 21%.
              Open book rewards people who have practiced finding the rule, not people who have skimmed it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">Practice for the Texas exam</h2>
            <p className="mt-4">
              The three free tests below are built from the SparkyPass journeyman bank and themed to the Texas outline:
              general requirements and wiring methods, then services and grounding and branch circuits, then a
              calculations-heavy set with motors and special occupancies. Every answer shows the NEC section for 2023
              and 2026, and the clock measures you against the app&apos;s three-minute-per-question target.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {TESTS.map((t) => (
                <TestCard key={t.slug} test={t} />
              ))}
            </div>
            <p className="mt-6">
              The app has the full {QUESTION_COUNT_LABEL} bank, including the master tier, residential and commercial load calculators,
              and a Progress Report that shows your pace against the three-minute budget. {TRIAL_DAYS}-day free trial.
            </p>
            <div className="-ml-3 mt-3">
              <AppStoreBadge height={48} placement="texas" />
            </div>
          </div>

          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight text-foreground">The Texas master electrician exam</h2>
            <p className="mt-4">
              Same structure, more of it. The master exam has an NEC knowledge portion of 75 questions (70 scored) in
              150 minutes and a calculations portion of 33 questions (30 scored) in 170 minutes, 70% to pass each, $78
              for both portions. To apply you need 12,000 hours of on-the-job training under a Texas master electrician
              and at least two years holding a journeyman electrician license, plus a $45 application fee. In fiscal
              2025 the pass rates were 22% on the knowledge portion and 19% on calculations. SparkyPass&apos;s master
              tier and load calculators are built for the extra calculation questions and the heavier weight on services
              and motors.
            </p>
          </div>

          <SparkyBubble pose="vest" size="md">
            <p>
              Texas gives you 130 minutes for 59 knowledge questions, about two minutes twelve seconds each, and 110
              minutes for 26 calculations, about four minutes each. Across the whole exam that averages close to three
              minutes a question, which is what the app and these free tests measure you against. On the knowledge
              portion you need to be quicker than that; let the calculations have the extra time.
            </p>
          </SparkyBubble>

          <div>
            <h2 className="font-display text-[22px] font-bold tracking-tight text-foreground">Sources</h2>
            <ul className="mt-3 space-y-1.5 text-[14px]">
              {SOURCES.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener" className="text-amber-text underline-offset-4 hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-stone-600">
              Verified October 27, 2026. Exam details change; confirm with TDLR and the current PSI Candidate Information
              Bulletin before you schedule. {NFPA_DISCLAIMER}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
