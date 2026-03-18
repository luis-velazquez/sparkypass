import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

/* ------------------------------------------------------------------
   SEO — metadata & Open Graph
   ------------------------------------------------------------------ */
export const metadata: Metadata = {
  title:
    "Texas Master Electrician Exam Prep — Free NEC Practice Tests & Games | SparkyPass",
  description:
    "Pass the Texas Master Electrician exam with the only gamified NEC prep platform. 500+ practice questions, 4 mini-games, daily challenges & leaderboards. Based on the 2023 NEC. Start your free trial today.",
  keywords: [
    "Texas master electrician exam prep",
    "NEC practice test",
    "electrician exam prep",
    "master electrician exam prep",
    "NEC 2023 practice questions",
    "electrician exam study guide",
    "Texas electrical license exam",
    "journeyman electrician exam prep",
    "NEC load calculation practice",
    "NEC code quiz",
    "gamified electrician study",
    "interactive electrician exam prep",
    "electrician exam prep app",
    "electrician exam prep online",
    "how to pass the master electrician exam Texas",
  ],
  openGraph: {
    title: "Texas Master Electrician Exam Prep — NEC Practice Tests & Games",
    description:
      "The only electrician exam prep that makes studying fun. 500+ NEC questions, 4 mini-games, daily challenges, Ohm's Law rewards & leaderboards. Start free.",
    url: "https://sparkypass.com",
    siteName: "SparkyPass",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://sparkypass.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "SparkyPass — Gamified Texas Master Electrician Exam Prep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Texas Master Electrician Exam Prep — SparkyPass",
    description:
      "Pass the NEC exam with gamified practice tests, mini-games & daily challenges. 500+ questions based on the 2023 NEC. Start free.",
    images: ["https://sparkypass.com/og-image.png"],
  },
  alternates: {
    canonical: "https://sparkypass.com",
  },
};

/* ------------------------------------------------------------------
   JSON-LD Structured Data
   ------------------------------------------------------------------ */
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What exam does SparkyPass prepare me for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SparkyPass is built for the Texas Master Electrician exam, aligned with the 2023 National Electrical Code (NEC). The content covers all major exam topics including load calculations, grounding, overcurrent protection, and more.",
      },
    },
    {
      "@type": "Question",
      name: "How many questions are on the Texas Master Electrician exam?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Texas Master Electrician exam consists of 100 multiple-choice questions. You need to score at least 75% overall and 70% in each section to pass. The exam is open-book — you can use the 2023 NEC code book.",
      },
    },
    {
      "@type": "Question",
      name: "How long is the free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You get 7 full days of unrestricted access to every feature — quizzes, flashcards, mock exams, mini-games, and load calculators. No credit card is required to start.",
      },
    },
    {
      "@type": "Question",
      name: "What happens when my trial expires?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your study progress is saved permanently. You simply won't be able to access study tools until you subscribe. No surprise charges, ever.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Cancel through your account settings or the Stripe billing portal. You'll retain access until the end of your current billing period.",
      },
    },
    {
      "@type": "Question",
      name: "How is SparkyPass different from other electrician exam prep?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SparkyPass is the only electrician exam prep platform with gamification. You earn Watts (our electricity-themed currency) for correct answers, compete on leaderboards, play 4 mini-games, maintain study streaks with daily challenges, and get guided by Sparky — your AI study buddy. Traditional prep is static PDFs and boring practice tests. SparkyPass makes studying fun so you actually stick with it.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a lifetime access option?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We offer Quarterly ($79.99), Yearly ($299.99), and Lifetime ($499.99) plans. The lifetime plan is a one-time payment with permanent access — including all future NEC code cycle updates.",
      },
    },
  ],
};

const courseStructuredData = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Texas Master Electrician Exam Prep",
  description:
    "Gamified exam preparation for the Texas Master Electrician license. Interactive NEC quizzes, mini-games, flashcards, mock exams, and load calculators based on the 2023 National Electrical Code.",
  provider: {
    "@type": "Organization",
    name: "SparkyPass",
    url: "https://sparkypass.com",
  },
  educationalLevel: "Professional",
  about: {
    "@type": "Thing",
    name: "National Electrical Code (NEC) 2023",
  },
  teaches: [
    "NEC Load Calculations (Article 220)",
    "Grounding and Bonding (Article 250)",
    "Overcurrent Protection (Article 240)",
    "Conductor Sizing (Article 310)",
    "Motor Calculations (Article 430)",
    "Services (Article 230)",
  ],
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: "Self-paced",
  },
};

const webAppStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SparkyPass",
  url: "https://sparkypass.com",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "7-day free trial, no credit card required",
  },
};

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqStructuredData,
            courseStructuredData,
            webAppStructuredData,
          ]),
        }}
      />
      <LandingPage />
    </>
  );
}
