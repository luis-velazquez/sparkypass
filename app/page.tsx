"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Zap,
  Brain,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SparkyMessage } from "@/components/sparky";

/* ------------------------------------------------------------------ */
/*  Animated counter — counts up when scrolled into view               */
/* ------------------------------------------------------------------ */
function AnimatedStat({
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

  return (
    <div ref={ref} className="text-center">
      <motion.p
        className="text-5xl md:text-6xl font-bold text-amber dark:text-sparky-green mb-2 font-display"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          {isInView ? value : 0}
        </motion.span>
        {suffix}
      </motion.p>
      <p className="text-muted-foreground text-sm uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const features = [
  {
    title: "Interactive Quizzes",
    description:
      "NEC-based questions covering every major exam topic with instant feedback and detailed explanations.",
    icon: Brain,
  },
  {
    title: "Flashcard Engine",
    description:
      "Spaced repetition system for key formulas, code references, and definitions you need to memorize.",
    icon: BookOpen,
  },
  {
    title: "Mock Exams",
    description:
      "Timed practice tests that mirror the real exam format so there are zero surprises on test day.",
    icon: ClipboardCheck,
  },
  {
    title: "Load Calculators",
    description:
      "Residential and commercial NEC load calculators with step-by-step breakdowns for Article 220.",
    icon: Calculator,
  },
  {
    title: "Progress Analytics",
    description:
      "Track strengths and weak spots across categories so you study smarter, not longer.",
    icon: TrendingUp,
  },
  {
    title: "Exam-Ready Confidence",
    description:
      "Know exactly when you're prepared. Our readiness score tells you if you're on track to pass.",
    icon: Award,
  },
];

const steps = [
  {
    step: "01",
    title: "Create Your Account",
    description:
      "Sign up in seconds. No credit card required — your 7-day free trial starts immediately.",
    icon: UserCheck,
  },
  {
    step: "02",
    title: "Study & Practice",
    description:
      "Work through quizzes, flashcards, and mock exams organized by NEC chapter and difficulty.",
    icon: Target,
  },
  {
    step: "03",
    title: "Pass the Exam",
    description:
      "Walk into the testing center confident. You've already proven you're ready.",
    icon: Award,
  },
];

const faqs = [
  {
    q: "What exam does SparkyPass prepare me for?",
    a: "SparkyPass is built for the Texas Master Electrician exam, aligned with the 2023 National Electrical Code (NEC). The content covers all major exam topics including load calculations, grounding, overcurrent protection, and more.",
  },
  {
    q: "How long is the free trial?",
    a: "You get 7 full days of unrestricted access to every feature — quizzes, flashcards, mock exams, and load calculators. No credit card is required to start.",
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
    q: "Is there a lifetime option?",
    a: "Yes. We offer Quarterly ($79.99), Yearly ($299), and Lifetime ($500) plans. The lifetime plan is a one-time payment with permanent access — no renewals.",
  },
  {
    q: "How are the quizzes different from free NEC practice tests online?",
    a: "Our questions are written specifically for the Texas Master Electrician exam format. You get detailed explanations with NEC article references, progress tracking, spaced repetition, and mock exams that simulate the real testing experience.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Home() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, {
    once: true,
    margin: "-60px",
  });

  return (
    <div className="flex flex-col">
      {/* ============================================================
          HERO
          Light: warm cream gradient  |  Dark: dark industrial slate
          ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream to-cream-dark dark:from-stone-950 dark:to-stone-950 py-20 md:py-32">
        {/* Blueprint grid background */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Radial glow behind headline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-amber/[0.08] dark:bg-amber/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber/20 bg-amber/5 dark:border-sparky-green/30 dark:bg-sparky-green/5 mb-8"
              >
                <div className="w-6 h-6 rounded-md bg-stone-900 flex items-center justify-center">
                  <img src="/lightning-bolt.svg" alt="" className="w-4 h-4" />
                </div>
                <span className="text-amber dark:text-sparky-green text-sm font-medium tracking-wide">
                  Texas Master Electrician Exam Prep
                </span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] font-display">
                <span className="text-foreground dark:text-white">
                  Pass the NEC Exam
                </span>
                <br />
                <span className="text-gradient-primary">
                  &amp; Master the Code
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-3 max-w-2xl mx-auto">
                Only <span className="font-semibold text-amber dark:text-sparky-green">26%</span> of
                candidates pass the Master Electrician exam on their first
                attempt.
              </p>
              <p className="text-lg md:text-xl text-foreground/80 dark:text-stone-300 mb-10 max-w-2xl mx-auto">
                SparkyPass gives you interactive quizzes, flashcards, mock
                exams, and NEC load calculators — everything you need to join
                the successful minority.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-amber hover:bg-amber-dark text-white dark:text-stone-950 font-bold text-lg px-10 py-6 w-full sm:w-auto shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] dark:shadow-[0_0_30px_rgba(163,255,0,0.15)] dark:hover:shadow-[0_0_40px_rgba(163,255,0,0.25)] transition-shadow"
                  >
                    Start Your 7-Day Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 w-full sm:w-auto border-border dark:border-stone-700 text-foreground dark:text-stone-300 hover:bg-muted dark:hover:bg-stone-800"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                No credit card required. Instant access.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream-dark dark:from-stone-950 to-transparent" />
      </section>

      {/* ============================================================
          STATS BAR
          Light: white with subtle border  |  Dark: dark strip
          ============================================================ */}
      <section className="bg-card dark:bg-stone-900 border-y border-border dark:border-stone-800 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <AnimatedStat value={500} suffix="+" label="Practice Questions" />
            <AnimatedStat value={2023} suffix="" label="NEC Code Book" />
            <AnimatedStat value={24} suffix="/7" label="Access Anytime" />
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — 3 steps
          Light: cream bg  |  Dark: dark slate
          ============================================================ */}
      <section className="bg-cream dark:bg-stone-950 py-20 md:py-28">
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
                  <div className="rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 p-8 h-full transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.08)]">
                    <span className="text-amber/15 dark:text-amber/30 text-6xl font-bold font-display absolute top-4 right-6 select-none">
                      {step.step}
                    </span>
                    <div className="w-12 h-12 rounded-lg bg-amber/10 flex items-center justify-center mb-5">
                      <Icon className="h-6 w-6 text-amber" />
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
                    <ChevronRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-border dark:text-stone-700" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES — 3x2 grid
          Light: white cards on cream  |  Dark: dark cards on slate
          ============================================================ */}
      <section
        className="bg-cream-dark dark:bg-stone-900 py-20 md:py-28"
        ref={featuresRef}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
              Everything You Need to Pass
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A comprehensive study platform covering all aspects of the Texas
              Master Electrician exam, aligned with the 2023 NEC.
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
                  <div className="rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-950/60 p-6 h-full transition-all duration-300 hover:border-amber/25 hover:shadow-card dark:hover:bg-stone-950/80">
                    <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-amber/15">
                      <Icon className="h-5 w-5 text-amber" />
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
        </div>
      </section>

      {/* ============================================================
          SPARKY — Meet your study buddy
          ============================================================ */}
      <section className="bg-cream dark:bg-stone-950 py-20 md:py-24 border-t border-border dark:border-stone-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
                Meet Your Study Buddy
              </h2>
              <p className="text-muted-foreground text-lg">
                Sparky the electrician is here to encourage you every step of
                the way.
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
                message="Hey there, future Master Electrician! I'm Sparky, and I'll be your guide on this journey. The exam might seem tough, but with consistent practice and the right mindset, you've got this! Remember, every master electrician started exactly where you are right now. Let's spark some knowledge together!"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
          TESTIMONIAL / QUOTE
          ============================================================ */}
      <section className="bg-card dark:bg-stone-900 py-20 md:py-24 border-t border-border dark:border-stone-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Zap className="h-8 w-8 text-amber/40 mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-display text-foreground leading-snug mb-6">
              &ldquo;The difference between a journeyman and a master
              isn&apos;t talent — it&apos;s{" "}
              <span className="text-amber dark:text-sparky-green">preparation</span>.&rdquo;
            </blockquote>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              Built by electricians, for electricians
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <section className="bg-cream dark:bg-stone-950 py-20 md:py-28 border-t border-border dark:border-stone-800">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center font-display">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border dark:border-stone-800 rounded-lg px-5 data-[state=open]:border-amber/20 transition-colors"
                >
                  <AccordionTrigger className="text-foreground text-base hover:no-underline hover:text-amber transition-colors py-5">
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

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="relative overflow-hidden bg-cream-dark dark:bg-stone-900 py-20 md:py-28 border-t border-border dark:border-stone-800">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber/[0.07] dark:bg-amber/[0.05] rounded-full blur-3xl pointer-events-none" />

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
              Join SparkyPass today and take the first step toward passing your
              NEC exam with confidence. Start free — no credit card needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-amber hover:bg-amber-dark text-white dark:text-stone-950 font-bold text-lg px-10 py-6 w-full sm:w-auto shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] dark:shadow-[0_0_30px_rgba(163,255,0,0.15)] dark:hover:shadow-[0_0_40px_rgba(163,255,0,0.25)] transition-shadow"
                >
                  Start Your 7-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 w-full sm:w-auto border-border dark:border-stone-700 text-foreground dark:text-stone-300 hover:bg-muted dark:hover:bg-stone-800"
                >
                  View Plans
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Shield className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <span className="text-border dark:text-stone-700">|</span>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>7-day free trial</span>
              </div>
              <span className="text-border dark:text-stone-700">|</span>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Zap className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
