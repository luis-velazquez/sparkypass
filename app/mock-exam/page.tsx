"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Clock,
  BookOpen,
  Play,
  Trophy,
  Target,
  XCircle,
  Loader2,
  FileText,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { SparkyMessage } from "@/components/sparky";
import { getAllBlueprints } from "@/data/blueprints";
import type { ExamBlueprint } from "@/types/mock-exam";

interface ExamOption {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number; // in minutes
  difficulty: "standard" | "challenging";
  icon: typeof ClipboardCheck;
  color: string;
  bgColor: string;
}

const EXAM_OPTIONS: ExamOption[] = [
  {
    id: "quick-practice",
    title: "Quick Practice",
    description: "A short 25-question practice test to warm up",
    questionCount: 25,
    timeLimit: 30,
    difficulty: "standard",
    icon: Target,
    color: "text-emerald dark:text-sparky-green",
    bgColor: "bg-emerald/10 dark:bg-sparky-green/10 dark:shadow-[0_0_15px_rgba(163,255,0,0.35)]",
  },
  {
    id: "half-exam",
    title: "Half Exam",
    description: "50 questions covering all major NEC articles",
    questionCount: 50,
    timeLimit: 60,
    difficulty: "standard",
    icon: BookOpen,
    color: "text-purple dark:text-purple-light",
    bgColor: "bg-purple-soft dark:bg-purple/10 dark:shadow-[0_0_15px_rgba(139,92,246,0.35)]",
  },
  {
    id: "full-exam",
    title: "Full Mock Exam",
    description: "Simulate the real exam with 100 questions",
    questionCount: 100,
    timeLimit: 120,
    difficulty: "standard",
    icon: ClipboardCheck,
    color: "text-amber dark:text-amber-light",
    bgColor: "bg-amber/10 dark:shadow-[0_0_15px_rgba(245,158,11,0.35)]",
  },
  {
    id: "challenge-mode",
    title: "Challenge Mode",
    description: "Hard questions only - test your mastery!",
    questionCount: 50,
    timeLimit: 45,
    difficulty: "challenging",
    icon: Trophy,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-500/10 dark:shadow-[0_0_15px_rgba(239,68,68,0.35)]",
  },
];

export default function MockExamPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState<ExamBlueprint | null>(null);
  const blueprints = getAllBlueprints();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    );
  }

  const handleStartExam = (examId: string) => {
    router.push(`/mock-exam/${examId}`);
  };

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
          <span className="text-amber dark:text-sparky-green">Mock Exam</span>
        </h1>
        <p className="text-muted-foreground">
          Simulate the real Texas Master Electrician exam with timed practice tests.
          Choose your challenge level and test your knowledge!
        </p>
      </motion.div>

      {/* State Exam Blueprints */}
      {blueprints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="relative z-10 mb-8"
        >
          <h2 className="text-lg font-semibold font-display text-foreground mb-4">State Exam Blueprints</h2>
          <div className="space-y-4">
            {blueprints.map((bp) => (
              <Card
                key={bp.id}
                className="cursor-pointer transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/30 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)] pressable border-border dark:border-stone-800 bg-card dark:bg-stone-900/50"
                onClick={() => setSelectedBlueprint(bp)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-soft dark:bg-purple/10 dark:shadow-[0_0_15px_rgba(139,92,246,0.35)] flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-purple dark:text-purple-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-foreground">{bp.name}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber/10 text-amber dark:bg-sparky-green/10 dark:text-sparky-green rounded-full">
                          <MapPin className="h-3 w-3" />
                          {bp.state}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-soft dark:bg-purple/10 text-purple dark:text-purple-light rounded-full">
                          Blueprint
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {bp.totalQuestions} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {Math.floor(bp.timeLimit / 60)}h {bp.timeLimit % 60 > 0 ? `${bp.timeLimit % 60}m` : ""}
                        </span>
                        <span>{bp.passingScore}% to pass</span>
                        <span>{bp.sections.length} sections</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Blueprint Confirmation Sheet */}
      <Sheet open={!!selectedBlueprint} onOpenChange={(open) => !open && setSelectedBlueprint(null)}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:right-auto md:rounded-2xl md:bottom-4 max-h-[85vh] flex flex-col">
          {selectedBlueprint && (
            <>
              {/* Fixed header — icon + title + stats */}
              <div className="px-5 pt-5 pb-2 shrink-0">
                <SheetHeader className="text-center pb-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-soft dark:bg-purple/10 dark:shadow-[0_0_15px_rgba(139,92,246,0.35)] flex items-center justify-center mx-auto mb-2">
                    <FileText className="h-6 w-6 text-purple dark:text-purple-light" />
                  </div>
                  <SheetTitle className="text-lg">{selectedBlueprint.name}</SheetTitle>
                  <SheetDescription>
                    {selectedBlueprint.state} {selectedBlueprint.examLevel.charAt(0).toUpperCase() + selectedBlueprint.examLevel.slice(1)} Exam
                  </SheetDescription>
                </SheetHeader>

                {/* Stats row — compact */}
                <div className="flex items-center justify-center gap-5 py-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold text-foreground">{selectedBlueprint.totalQuestions}</span>
                    <span className="text-[11px] text-muted-foreground">Questions</span>
                  </div>
                  <div className="w-px h-7 bg-border dark:bg-stone-700" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold text-foreground">{Math.floor(selectedBlueprint.timeLimit / 60)}h {selectedBlueprint.timeLimit % 60 > 0 ? `${selectedBlueprint.timeLimit % 60}m` : ""}</span>
                    <span className="text-[11px] text-muted-foreground">Time Limit</span>
                  </div>
                  <div className="w-px h-7 bg-border dark:bg-stone-700" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold text-foreground">{selectedBlueprint.passingScore}%</span>
                    <span className="text-[11px] text-muted-foreground">To Pass</span>
                  </div>
                </div>
              </div>

              {/* Scrollable middle — portions + sections */}
              <div className="flex-1 overflow-y-auto px-5 min-h-0">
                {/* Portions breakdown */}
                {selectedBlueprint.portions && selectedBlueprint.portions.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {selectedBlueprint.portions.map((portion) => (
                      <div key={portion.name} className="rounded-lg bg-muted/50 dark:bg-stone-800/50 px-3 py-2">
                        <p className="text-xs font-semibold text-foreground">{portion.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {portion.scoredItems} scored &middot; {portion.timeLimit} min
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section list */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Sections</p>
                  <div className="rounded-lg border border-border dark:border-stone-800">
                    {selectedBlueprint.sections.map((section, i) => (
                      <div
                        key={section.name}
                        className={`flex items-center justify-between px-3 py-1.5 text-sm ${
                          i !== selectedBlueprint.sections.length - 1 ? "border-b border-border/50 dark:border-stone-800/50" : ""
                        }`}
                      >
                        <span className="text-foreground text-[13px]">{section.name}</span>
                        <span className="text-muted-foreground shrink-0 ml-3 tabular-nums font-medium text-[13px]">{section.questionCount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed footer — buttons */}
              <SheetFooter className="flex-col gap-2 px-5 pt-3.5 pb-5 shrink-0">
                <Button
                  size="lg"
                  className="bg-amber hover:bg-amber-dark text-white w-full dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 dark:shadow-[0_0_20px_rgba(163,255,0,0.2)]"
                  onClick={() => handleStartExam(selectedBlueprint.id)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Exam
                </Button>
                <SheetClose asChild>
                  <Button variant="outline" size="lg" className="w-full">
                    Cancel
                  </Button>
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Practice Tests */}
      <h2 className="relative z-10 text-lg font-semibold font-display text-foreground mb-4">Practice Tests</h2>

      {/* Exam Options Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {EXAM_OPTIONS.map((exam, index) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
          >
            <Card
              className={`h-full cursor-pointer transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/30 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.08)] pressable border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 ${
                selectedExam === exam.id ? "ring-2 ring-amber dark:ring-sparky-green" : ""
              } ${exam.difficulty === "challenging" ? "border-red-500/30" : ""}`}
              onClick={() => setSelectedExam(exam.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-lg ${exam.bgColor} flex items-center justify-center transition-all duration-300`}
                  >
                    <exam.icon className={`h-6 w-6 ${exam.color}`} />
                  </div>
                  {exam.difficulty === "challenging" && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded-full">
                      Hard Mode
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{exam.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {exam.description}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{exam.questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{exam.timeLimit} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bottom Sheet for Exam Confirmation */}
      <Sheet open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:right-auto md:rounded-2xl md:bottom-4">
          {selectedExam && (() => {
            const exam = EXAM_OPTIONS.find((e) => e.id === selectedExam);
            if (!exam) return null;
            return (
              <div className="px-5 pt-5 pb-5">
                {/* Icon + Title */}
                <SheetHeader className="text-center pb-3">
                  <div className={`w-12 h-12 rounded-xl ${exam.bgColor} flex items-center justify-center mx-auto mb-2 transition-all duration-300`}>
                    <exam.icon className={`h-6 w-6 ${exam.color}`} />
                  </div>
                  <SheetTitle className="text-lg">{exam.title}</SheetTitle>
                  <SheetDescription>{exam.description}</SheetDescription>
                </SheetHeader>

                {/* Stats row */}
                <div className="flex items-center justify-center gap-5 py-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold text-foreground">{exam.questionCount}</span>
                    <span className="text-[11px] text-muted-foreground">Questions</span>
                  </div>
                  <div className="w-px h-7 bg-border dark:bg-stone-700" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base font-bold text-foreground">{exam.timeLimit}m</span>
                    <span className="text-[11px] text-muted-foreground">Time Limit</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[11px] text-center text-muted-foreground mt-1 px-3">
                  Once you begin, the timer will start. You can pause but not go back to previous questions.
                </p>

                {/* Actions */}
                <SheetFooter className="flex-col gap-2 mt-5">
                  <Button
                    size="lg"
                    className="bg-amber hover:bg-amber-dark text-white w-full dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 dark:shadow-[0_0_20px_rgba(163,255,0,0.2)]"
                    onClick={() => handleStartExam(selectedExam)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Exam
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline" size="lg" className="w-full">
                      Cancel
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Exam Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="relative z-10 mb-8"
      >
        <h2 className="text-xl font-semibold font-display text-foreground mb-4">Exam Day Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="h-5 w-5 text-amber dark:text-amber-light" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Time Management</h3>
              <p className="text-sm text-muted-foreground">
                Pace yourself - aim for about 1 minute per question. Flag difficult ones and return later.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-lg bg-emerald/10 dark:bg-sparky-green/10 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="h-5 w-5 text-emerald dark:text-sparky-green" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Read Carefully</h3>
              <p className="text-sm text-muted-foreground">
                Pay attention to keywords like &quot;minimum,&quot; &quot;maximum,&quot; &quot;shall,&quot; and &quot;permitted.&quot;
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-lg bg-purple-soft dark:bg-purple/10 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="h-5 w-5 text-purple dark:text-purple-light" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Eliminate Wrong Answers</h3>
              <p className="text-sm text-muted-foreground">
                When unsure, eliminate obviously wrong choices first to improve your odds.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative z-10"
      >
        <SparkyMessage
          size="medium"
          message="Mock exams are your secret weapon! Taking practice tests under timed conditions builds the mental stamina you need for exam day. Don't worry about failing practice tests - that's how you identify areas to improve!"
        />
      </motion.div>
      </div>
    </main>
  );
}
