import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PracticeTest } from "@/components/practice/PracticeTest";
import { isCodeReference } from "@/components/site/CodeRef";
import { JsonLd } from "@/components/site/JsonLd";
import { TESTS, TEST_SLUGS, getTest, testPath } from "@/lib/practice-tests";
import { pageMetadata } from "@/lib/seo";
import { NFPA_DISCLAIMER, PRACTICE_HUB_PATH, SITE_URL } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return TEST_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const test = getTest(slug);
  if (!test) return {};
  return pageMetadata({
    title: `Journeyman Electrician Practice Test ${test.number}: 20 NEC Questions`,
    absoluteTitle: true,
    description: `Free journeyman electrician practice test ${test.number}: 20 NEC questions on ${test.title.toLowerCase()}, answers explained with the code section. No login.`,
    path: testPath(test.slug),
    ogImage: `${PRACTICE_HUB_PATH}/opengraph-image`,
    ogImageAlt: "Free journeyman electrician practice test — 60 NEC questions with explanations",
  });
}

export default async function PracticeTestPage({ params }: { params: Params }) {
  const { slug } = await params;
  const test = getTest(slug);
  if (!test) notFound();

  const calc = test.questions.filter((q) => q.calculation).length;
  const url = `${SITE_URL}${testPath(test.slug)}`;
  const siblings = TESTS.filter((t) => t.slug !== test.slug).map((t) => ({
    slug: t.slug,
    number: t.number,
    title: t.title,
    href: testPath(t.slug),
  }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "SparkyPass", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Free journeyman electrician practice test", item: `${SITE_URL}${PRACTICE_HUB_PATH}` },
        { "@type": "ListItem", position: 3, name: `Practice test ${test.number}: ${test.title}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: `Journeyman electrician practice test ${test.number}: ${test.title}`,
      url,
      description: test.blurb,
      educationalLevel: "Journeyman electrician",
      isAccessibleForFree: true,
      learningResourceType: "Practice test",
      about: { "@type": "Thing", name: "National Electrical Code" },
      provider: { "@type": "Organization", name: "SparkyPass", url: SITE_URL },
      hasPart: test.questions.map((q) => ({
        "@type": "Question",
        eduQuestionType: "Multiple choice",
        learningResourceType: "Practice problem",
        name: `Question ${q.n}`,
        text: q.prompt,
        suggestedAnswer: q.options.map((opt, i) => ({ "@type": "Answer", position: i, text: opt })),
        acceptedAnswer: {
          "@type": "Answer",
          position: q.answer,
          text: q.options[q.answer],
          comment: {
            "@type": "Comment",
            text: isCodeReference(q.ref2023)
              ? `${q.explanation} (2023 NEC ${q.ref2023}${q.ref2026 !== q.ref2023 ? `; 2026 NEC ${q.ref2026}` : ""})`
              : `${q.explanation} (${q.ref2023})`,
          },
        },
      })),
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="font-mono text-[12px] uppercase tracking-[0.14em] text-stone-600">
          <Link href="/" className="hover:text-foreground">SparkyPass</Link> <span aria-hidden="true">/</span>{" "}
          <Link href={PRACTICE_HUB_PATH} className="hover:text-foreground">Free practice tests</Link> <span aria-hidden="true">/</span> Test {test.number}
        </nav>
        <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.18em] text-amber-text">
          Free practice test {test.number} of {TESTS.length} · 20 questions · {calc} calculations
        </p>
        <h1 className="mt-3 font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-foreground sm:text-4xl">
          Journeyman Electrician Practice Test {test.number}: {test.title}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-stone-600">{test.blurb}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {test.focus.map((f) => (
            <li key={f} className="rounded-full bg-cream-dark px-2.5 py-1 text-[12px] font-semibold text-stone-600">
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[15px] leading-relaxed text-stone-600">
          Pick an answer to lock it in and see the explanation with the NEC section for the 2023 and 2026 editions. The
          clock starts with your first answer. Aim for 14 of 20, the 70% line Texas and many other states use.
        </p>

        <div className="mt-8">
          <PracticeTest test={test} siblings={siblings} />
        </div>

        <p className="mt-12 text-[13px] leading-relaxed text-stone-600">{NFPA_DISCLAIMER}</p>
      </div>
    </>
  );
}
