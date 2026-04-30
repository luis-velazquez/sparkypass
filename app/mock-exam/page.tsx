"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, Clock, Target, ChevronRight, Calculator, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { EXAM_CONFIGS, EXAM_TOPIC_LABELS } from "@/lib/mock-exam";
import type { ExamConfig } from "@/types/mock-exam";

export default function MockExamPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-cream dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  const journeymanExams = EXAM_CONFIGS.filter((c) => c.level === "journeyman");
  const masterExams = EXAM_CONFIGS.filter((c) => c.level === "master");

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <ClipboardCheck className="h-12 w-12 text-amber dark:text-sparky-green mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
            Texas <span className="text-amber dark:text-sparky-green">Mock Exam</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Simulates the real PSI exam format — same topic breakdown, question count, timer, and passing score
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-8"
        >
          <SparkyMessage size="medium" message="This is the closest thing to the real exam. Same number of questions, same topics, same time limit. Treat it like exam day!" />
        </motion.div>

        {/* Journeyman Section */}
        <ExamSection title="Journeyman" exams={journeymanExams} delay={0.1} onSelect={(id) => router.push(`/mock-exam/${id}`)} />

        {/* Master Section */}
        <ExamSection title="Master" exams={masterExams} delay={0.2} onSelect={(id) => router.push(`/mock-exam/${id}`)} />
      </div>
    </main>
  );
}

function ExamSection({ title, exams, delay, onSelect }: { title: string; exams: ExamConfig[]; delay: number; onSelect: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="mb-6"
    >
      <h2 className="text-lg font-bold font-display text-foreground mb-3">{title} Exam</h2>
      <div className="space-y-3">
        {exams.map((config) => {
          const Icon = config.type === "calculations" ? Calculator : BookOpen;
          const typeLabel = config.type === "calculations" ? "Calculations" : "Knowledge";

          return (
            <button
              key={config.id}
              onClick={() => onSelect(config.id)}
              className="w-full text-left p-4 rounded-xl border border-border dark:border-stone-800 hover:border-amber/40 dark:hover:border-sparky-green/30 bg-card dark:bg-stone-900/50 hover:bg-amber/5 dark:hover:bg-sparky-green/5 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-amber dark:text-sparky-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-foreground">{typeLabel} Portion</span>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      {config.totalQuestions} questions
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {config.timeLimit} min
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Pass: {config.passingScore}/{config.totalQuestions} ({config.passingPercent}%)
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
