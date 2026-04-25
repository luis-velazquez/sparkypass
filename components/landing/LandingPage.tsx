"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import {
  Zap,
  Brain,
  Gamepad2,
  BookOpen,
  ClipboardCheck,
  Calculator,
  TrendingUp,
  ArrowRight,
  Shield,
  Clock,
  ChevronRight,
  UserCheck,
  Target,
  Award,
  Flame,
  Trophy,
  X,
  Check,
  CircuitBoard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SparkyMessage } from "@/components/sparky";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BetaBadge } from "@/components/ui/beta-badge";

/* ------------------------------------------------------------------ */
/*  Animated counter — counts up when scrolled into view               */
/* ------------------------------------------------------------------ */
function AnimatedCounter({
  value,
  suffix = "",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return unsubscribe;
  }, [rounded]);

  return (
    <div ref={ref} className="text-center">
      <motion.p
        className="text-5xl md:text-6xl font-bold text-amber dark:text-sparky-green mb-2 font-display"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, type: "spring" }}
      >
        {display}
        {suffix}
      </motion.p>
      <p className="text-muted-foreground text-sm uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared CTA button classes                                          */
/* ------------------------------------------------------------------ */
const ctaPrimaryClass =
  "bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 font-bold text-lg px-10 py-6 w-full sm:w-auto animate-cta-glow hover:animate-none hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] dark:hover:shadow-[0_0_25px_rgba(163,255,0,0.15)] transition-shadow";

const ctaOutlineClass =
  "text-lg px-8 py-6 w-full sm:w-auto border-border dark:border-stone-700 text-foreground dark:text-stone-300 hover:bg-muted dark:hover:bg-stone-800";

/* ------------------------------------------------------------------ */
/*  Circuit trace SVG background pattern                               */
/* ------------------------------------------------------------------ */
function CircuitPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`absolute pointer-events-none ${className}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="circuit"
          x="0"
          y="0"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          {/* Horizontal traces */}
          <line x1="0" y1="30" x2="50" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.15" />
          <line x1="70" y1="30" x2="120" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          <line x1="0" y1="90" x2="40" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          <line x1="80" y1="90" x2="120" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.12" />
          {/* Vertical traces */}
          <line x1="50" y1="30" x2="50" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.12" />
          <line x1="70" y1="0" x2="70" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          <line x1="80" y1="60" x2="80" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          {/* Corner turns */}
          <line x1="50" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.12" />
          <line x1="40" y1="90" x2="40" y2="110" stroke="currentColor" strokeWidth="1" opacity="0.08" />
          {/* Junction dots */}
          <circle cx="50" cy="30" r="2" fill="currentColor" opacity="0.2" />
          <circle cx="70" cy="30" r="2" fill="currentColor" opacity="0.15" />
          <circle cx="80" cy="90" r="2" fill="currentColor" opacity="0.15" />
          <circle cx="50" cy="60" r="2" fill="currentColor" opacity="0.18" />
          <circle cx="80" cy="60" r="2" fill="currentColor" opacity="0.15" />
          <circle cx="40" cy="90" r="2" fill="currentColor" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Angled section divider                                             */
/* ------------------------------------------------------------------ */
function AngleDivider({
  from,
  to,
  fromDark,
  toDark,
  flip = false,
}: {
  from: string;
  to: string;
  fromDark: string;
  toDark: string;
  flip?: boolean;
}) {
  // Renders an SVG with a diagonal cut. The top triangle is `from` color,
  // the bottom triangle is `to` color, creating an angled transition.
  const points = flip ? "0,0 100,0 0,100" : "0,0 100,0 100,100";
  return (
    <div className="relative h-16 md:h-24 -my-px" aria-hidden="true">
      {/* Light mode */}
      <svg
        className="absolute inset-0 w-full h-full dark:hidden"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect width="100" height="100" fill={to} />
        <polygon points={points} fill={from} />
      </svg>
      {/* Dark mode */}
      <svg
        className="absolute inset-0 w-full h-full hidden dark:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect width="100" height="100" fill={toDark} />
        <polygon points={points} fill={fromDark} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const features = [
  {
    title: "4 Interactive Mini-Games",
    description:
      "Index Sniper, Slang to Code, Formula Builder & more — learn NEC concepts through fast-paced gameplay, not boring flashcards.",
    icon: Gamepad2,
  },
  {
    title: "Ohm's Law Rewards",
    description:
      "Earn Watts for every correct answer, climb Voltage tiers, and track your Amps. An electricity-themed reward system built for electricians.",
    icon: Zap,
  },
  {
    title: "Daily Challenges & Streaks",
    description:
      "New challenges every day keep you coming back. Build streaks for bonus Watts and unlock milestone rewards at 7, 14, and 30 days.",
    icon: Flame,
  },
  {
    title: "Circuit Breaker Mode",
    description:
      "High-stakes practice — two wrong answers in a row and you trip. Face real pressure so the actual exam feels easy.",
    icon: CircuitBoard,
  },
  {
    title: "Leaderboards & Friends",
    description:
      "Compete globally or challenge friends. See who earns the most Watts and climbs the ranks from Watt Apprentice to Gigawatt Electrician.",
    icon: Trophy,
  },
  {
    title: "NEC Load Calculators",
    description:
      "Residential and commercial load calculators with step-by-step NEC Article 220 breakdowns — a tool competitors don't offer.",
    icon: Calculator,
  },
];

const bonusFeatures = [
  {
    title: "500+ NEC Practice Questions",
    description:
      "Every question mapped to the 2023 NEC with instant feedback and detailed code references.",
    icon: Brain,
  },
  {
    title: "Flashcards & Spaced Repetition",
    description:
      "Smart review system that resurfaces your weak spots at the perfect time for long-term retention.",
    icon: BookOpen,
  },
  {
    title: "Timed Mock Exams",
    description:
      "Full-length practice tests that mirror the real exam format — no surprises on test day.",
    icon: ClipboardCheck,
  },
  {
    title: "Power Grid Analytics",
    description:
      "Visual dashboard showing your mastery per NEC category — see exactly where to focus.",
    icon: TrendingUp,
  },
];

const steps = [
  {
    step: "01",
    title: "Create Your Free Account",
    description:
      "Sign up in seconds. No credit card required — your 30-day free beta trial starts immediately with full access to every feature.",
    icon: UserCheck,
  },
  {
    step: "02",
    title: "Play, Study & Compete",
    description:
      "Work through quizzes and mini-games, earn Watts, climb leaderboards, and tackle daily challenges organized by NEC chapter.",
    icon: Target,
  },
  {
    step: "03",
    title: "Pass the Exam",
    description:
      "Walk into the testing center confident. Your Power Grid shows you're ready — you've already proven it.",
    icon: Award,
  },
];

const comparisonRows = [
  { feature: "Interactive mini-games", sparky: true, traditional: false },
  { feature: "Rewards & progression system", sparky: true, traditional: false },
  { feature: "Daily challenges & streaks", sparky: true, traditional: false },
  { feature: "Leaderboards & friends", sparky: true, traditional: false },
  { feature: "Study mascot & encouragement", sparky: true, traditional: false },
  { feature: "NEC load calculators", sparky: true, traditional: false },
  { feature: "NEC practice questions", sparky: true, traditional: true },
  { feature: "Mock exams", sparky: true, traditional: true },
  { feature: "Spaced repetition review", sparky: true, traditional: false },
  { feature: "Power grid mastery tracker", sparky: true, traditional: false },
];

const faqs = [
  {
    q: "What exam does SparkyPass prepare me for?",
    a: "SparkyPass is built for the Texas Master Electrician exam, aligned with the 2023 National Electrical Code (NEC). The content covers all major exam topics including load calculations, grounding, overcurrent protection, and more.",
  },
  {
    q: "How many questions are on the Texas Master Electrician exam?",
    a: "The Texas Master Electrician exam consists of 100 multiple-choice questions. You need to score at least 75% overall and 70% in each section to pass. The exam is open-book — you can use the 2023 NEC code book.",
  },
  {
    q: "How is SparkyPass different from other electrician exam prep?",
    a: "SparkyPass is the only electrician exam prep platform with gamification. You earn Watts for correct answers, compete on leaderboards, play 4 mini-games, maintain study streaks with daily challenges, and get guided by Sparky — your study buddy. Traditional prep is static PDFs and boring practice tests. SparkyPass makes studying fun so you actually stick with it.",
  },
  {
    q: "How long is the free trial?",
    a: "You get 7 full days of unrestricted access to every feature — quizzes, flashcards, mock exams, mini-games, and load calculators. No credit card is required to start.",
  },
  {
    q: "What happens when my trial expires?",
    a: "Your study progress is saved permanently. You simply won't be able to access study tools until you subscribe. No surprise charges, ever.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel through your account settings or the Stripe billing portal. You'll retain access until the end of your current billing period.",
  },
  {
    q: "Is there a lifetime access option?",
    a: "Yes. We offer Quarterly ($79.99), Yearly ($299.99), and Lifetime ($499.99) plans. The lifetime plan is a one-time payment with permanent access — including all future NEC code cycle updates.",
  },
  {
    q: "How are the quizzes different from free NEC practice tests online?",
    a: "Our questions are written specifically for the Texas Master Electrician exam format. You get detailed explanations with NEC article references, a gamified reward system, spaced repetition, progress tracking, and mock exams that simulate the real testing experience. Free tests online give you questions — SparkyPass gives you a complete study system.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export function LandingPage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, {
    once: true,
    margin: "-60px",
  });

  return (
    <div className="flex flex-col">
      <LandingNav />

      {/* ============================================================
          HERO — split layout: text left, preview right on lg+
          ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream to-cream-dark dark:from-stone-950 dark:to-stone-950 pt-28 md:pt-36 lg:pt-40 pb-16 md:pb-24 lg:pb-32">
        {/* Circuit trace background */}
        <CircuitPattern className="inset-0 text-amber dark:text-sparky-green opacity-40 dark:opacity-30" />
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="absolute top-1/3 left-1/4 w-[600px] h-[500px] bg-amber/[0.07] dark:bg-sparky-green/[0.03] rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber/[0.05] dark:bg-sparky-green/[0.02] rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber/20 bg-amber/5 dark:border-stone-700 dark:bg-stone-800/50 mb-6"
              >
                <div className="w-6 h-6 rounded-md bg-amber/15 dark:bg-stone-900 flex items-center justify-center">
                  <img
                    src="/sparkypass-icon-orange.svg"
                    alt=""
                    className="w-4 h-4"
                  />
                </div>
                <span className="text-amber dark:text-stone-300 text-sm font-medium tracking-wide">
                  Texas Master Electrician Exam Prep
                </span>
                <span className="mx-1 text-amber/30 dark:text-stone-600">|</span>
                <BetaBadge size="md" />
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1] font-display">
                <span className="text-foreground dark:text-white">
                  The Only NEC Exam Prep
                </span>
                <br />
                <span className="text-gradient-primary">
                  That&apos;s Actually Fun
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-3">
                Only{" "}
                <span className="font-semibold text-amber dark:text-sparky-green">
                  26%
                </span>{" "}
                of candidates pass the Master Electrician exam on their first
                attempt. Boring study guides are part of the problem.
              </p>
              <p className="text-lg md:text-xl text-foreground/80 dark:text-stone-300 mb-8">
                SparkyPass combines NEC practice questions with{" "}
                <strong>mini-games, daily challenges, leaderboards</strong>, and
                an electricity-themed reward system — so you actually{" "}
                <em>want</em> to study.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Button size="lg" className={ctaPrimaryClass} asChild>
                  <Link href="/register">
                    Start Your Free Beta Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={ctaOutlineClass}
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center lg:justify-start gap-1.5">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                No credit card required. Instant access.
              </p>
            </motion.div>

            {/* Right — product preview */}
            <div className="flex-1 w-full lg:max-w-[560px]">
              <HeroPreview />
            </div>
          </div>
        </div>

      </section>

      {/* Hero → Stats angle */}
      <AngleDivider
        from="#F5EFE0"
        to="#FFFFFF"
        fromDark="#0c0a09"
        toDark="#1c1917"
      />

      {/* ============================================================
          STATS BAR
          ============================================================ */}
      <section className="bg-card dark:bg-stone-900 border-b border-border dark:border-stone-800 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <AnimatedCounter value={500} suffix="+" label="Practice Questions" />
            <AnimatedCounter value={4} suffix="" label="Mini-Games" />
            <div className="text-center">
              <p className="text-5xl md:text-6xl font-bold text-amber dark:text-sparky-green mb-2 font-display">
                2023
              </p>
              <p className="text-muted-foreground text-sm uppercase tracking-widest">
                NEC Code Edition
              </p>
            </div>
            <AnimatedCounter value={24} suffix="/7" label="Access Anytime" />
          </div>
        </div>
      </section>

      {/* ============================================================
          PROBLEM — Why traditional prep fails
          ============================================================ */}
      <section className="bg-cream dark:bg-stone-950 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 font-display">
                Traditional Exam Prep Is Broken
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Static PDFs, dry practice tests, and zero feedback. No wonder 3
                out of 4 candidates fail on their first attempt. You don&apos;t
                need <em>more</em> content — you need a system that makes you{" "}
                <strong>want to study every day</strong>.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: BookOpen,
                  title: "Low Retention",
                  text: "Passive reading doesn't stick. Interactive practice and games build lasting recall.",
                  color: "text-red-500",
                  bg: "bg-red-500/10",
                },
                {
                  icon: TrendingUp,
                  title: "No Feedback Loop",
                  text: "Without tracking weak spots, you waste time re-studying what you already know.",
                  color: "text-amber",
                  bg: "bg-amber/10",
                },
                {
                  icon: Flame,
                  title: "Motivation Dies",
                  text: "No streaks, no rewards, no community. Most people quit before they're ready.",
                  color: "text-orange-500",
                  bg: "bg-orange-500/10",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 p-6"
                >
                  <div className={`w-14 h-14 rounded-xl ${item.bg} flex items-center justify-center mb-4 mx-auto`}>
                    <item.icon className={`h-7 w-7 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — 3 steps
          ============================================================ */}
      <section id="how-it-works" className="scroll-mt-16 bg-cream-dark dark:bg-stone-900 py-20 md:py-28 border-t border-border dark:border-stone-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From sign-up to exam day in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative group"
                >
                  <div className="rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-950/60 p-8 h-full">
                    <span
                      aria-hidden="true"
                      className="text-amber/15 dark:text-sparky-green/10 text-6xl font-bold font-display absolute top-4 right-6 select-none"
                    >
                      {step.step}
                    </span>
                    <div className="w-12 h-12 rounded-lg bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center mb-5">
                      <Icon
                        className="h-6 w-6 text-amber dark:text-sparky-green"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  {/* Connector arrow (desktop only) */}
                  {index < steps.length - 1 && (
                    <ChevronRight
                      aria-hidden="true"
                      className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-border dark:text-stone-700"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES — What makes SparkyPass fun
          ============================================================ */}
      <section
        id="features"
        className="scroll-mt-16 relative overflow-hidden bg-cream dark:bg-stone-950 py-20 md:py-28 border-t border-border dark:border-stone-800"
        ref={featuresRef}
      >
        <CircuitPattern className="inset-0 text-amber dark:text-sparky-green opacity-20 dark:opacity-15" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
              Study Tools That Feel Like{" "}
              <span className="text-gradient-primary">Games</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The secret to passing the NEC exam? Actually enjoying the
              preparation. Here&apos;s what makes SparkyPass different from
              every other exam prep out there.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group"
                >
                  <div className="rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber/10 dark:hover:shadow-sparky-green/5 hover:border-amber/30 dark:hover:border-sparky-green/20">
                    <div className="w-10 h-10 rounded-lg bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-amber/20 dark:group-hover:bg-sparky-green/20">
                      <Icon
                        className="h-5 w-5 text-amber dark:text-sparky-green"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bonus features — smaller row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mt-8">
            {bonusFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.4,
                    delay: 0.5 + index * 0.06,
                  }}
                >
                  <div className="rounded-lg border border-border dark:border-stone-800 bg-card/50 dark:bg-stone-900/30 p-4 h-full transition-all duration-300 hover:-translate-y-0.5 hover:border-amber/20 dark:hover:border-sparky-green/15">
                    <div className="flex items-start gap-3">
                      <Icon
                        className="h-4 w-4 text-amber dark:text-sparky-green mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features → Comparison angle */}
      <AngleDivider
        from="#FEFCF6"
        to="#F5EFE0"
        fromDark="#0c0a09"
        toDark="#1c1917"
        flip
      />

      {/* ============================================================
          COMPARISON TABLE — SparkyPass vs Traditional
          ============================================================ */}
      <section id="compare" className="scroll-mt-16 bg-cream-dark dark:bg-stone-900 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
              SparkyPass vs Traditional Prep
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              See why gamified learning beats boring study guides.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-xl border border-border dark:border-stone-800 overflow-hidden bg-card dark:bg-stone-950/60">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-4 border-b border-border dark:border-stone-800 bg-amber/5 dark:bg-stone-900/50">
                <span className="text-sm font-medium text-muted-foreground">
                  Feature
                </span>
                <span className="text-sm font-bold text-amber dark:text-sparky-green w-24 text-center">
                  SparkyPass
                </span>
                <span className="text-sm font-medium text-muted-foreground w-24 text-center">
                  Traditional
                </span>
              </div>
              {/* Rows */}
              {comparisonRows.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-3 ${
                    i < comparisonRows.length - 1
                      ? "border-b border-border/50 dark:border-stone-800/50"
                      : ""
                  }`}
                >
                  <span className="text-sm text-foreground">{row.feature}</span>
                  <span className="w-24 flex justify-center">
                    {row.sparky ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </span>
                  <span className="w-24 flex justify-center">
                    {row.traditional ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          SPARKY + QUOTE — combined motivational section
          ============================================================ */}
      <section className="bg-cream dark:bg-stone-950 py-20 md:py-28 border-t border-border dark:border-stone-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Sparky */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
                Meet Sparky, Your Study Buddy
              </h2>
              <p className="text-muted-foreground text-lg">
                Sparky celebrates your wins, encourages you after tough
                questions, and keeps you motivated all the way to exam day.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center"
            >
              <SparkyMessage
                size="large"
                message="Hey future Master Electrician! I'm Sparky — your guide on this journey. With mini-games, daily challenges, and a little friendly competition, we'll make studying feel less like a chore and more like a challenge worth winning. Let's spark some knowledge!"
              />
            </motion.div>

            {/* Quote */}
            <motion.figure
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center mt-16 pt-12 border-t border-border/50 dark:border-stone-800/50"
            >
              <Zap
                className="h-6 w-6 text-amber/30 dark:text-stone-700 mx-auto mb-5"
                aria-hidden="true"
              />
              <blockquote className="text-xl md:text-2xl font-display text-foreground leading-snug mb-4">
                &ldquo;The difference between a journeyman and a master
                isn&apos;t talent — it&apos;s{" "}
                <span className="text-amber dark:text-sparky-green">
                  preparation
                </span>
                .&rdquo;
              </blockquote>
              <figcaption className="text-muted-foreground text-xs uppercase tracking-widest">
                Built by electricians, for electricians
              </figcaption>
            </motion.figure>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <section id="faq" className="scroll-mt-16 bg-cream dark:bg-stone-950 py-20 md:py-28 border-t border-border dark:border-stone-800">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center font-display">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.q}
                  value={faq.q}
                  className="border border-border dark:border-stone-800 rounded-lg px-5 data-[state=open]:border-amber/20 dark:data-[state=open]:border-stone-700 transition-colors"
                >
                  <AccordionTrigger className="text-foreground text-base hover:no-underline hover:text-amber dark:hover:text-stone-200 transition-colors py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* FAQ → CTA angle */}
      <AngleDivider
        from="#FEFCF6"
        to="#F5EFE0"
        fromDark="#0c0a09"
        toDark="#1c1917"
      />

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="relative overflow-hidden bg-cream-dark dark:bg-stone-900 py-20 md:py-28">
        {/* Circuit traces + ambient glow */}
        <CircuitPattern className="inset-0 text-amber dark:text-sparky-green opacity-25 dark:opacity-15" />
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber/[0.07] dark:bg-sparky-green/[0.02] rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-display">
              Ready to Become a{" "}
              <span className="text-gradient-primary">Master Electrician</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              Join SparkyPass today and start studying the way it should be —
              fun, competitive, and effective. Start free — no credit card
              needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className={ctaPrimaryClass} asChild>
                <Link href="/register">
                  Start Your Free Beta Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={ctaOutlineClass}
                asChild
              >
                <Link href="/pricing">View Plans</Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>No credit card required</span>
              </div>
              <span
                aria-hidden="true"
                className="text-border dark:text-stone-700"
              >
                |
              </span>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>30-day free trial</span>
              </div>
              <span
                aria-hidden="true"
                className="text-border dark:text-stone-700"
              >
                |
              </span>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Zap className="h-4 w-4" aria-hidden="true" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
