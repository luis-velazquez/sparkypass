"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import {
  ClipboardCheck,
  Clock,
  Target,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Star,
  StarOff,
  Bookmark,
  Loader2,
  Zap,
  Play,
  Book,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SparkyMessage } from "@/components/sparky";
import { QuestionCard } from "@/components/quiz-engine";
import { getExamConfig, generateMockExam, EXAM_TOPIC_LABELS } from "@/lib/mock-exam";
import { useNecVersion } from "@/lib/nec-version";
import { ReviewGridBackground, ReviewLoadingState } from "@/app/(review)/shared";
import type { Question, ExamTopic } from "@/types/question";
import type { ExamConfig, TopicResult } from "@/types/mock-exam";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MockExamContent() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { necVersion } = useNecVersion();
  const examId = params.examId as string;
  const config = getExamConfig(examId);

  // Phases: "confirm" → "playing" → "finished"
  const [phase, setPhase] = useState<"confirm" | "playing" | "finished">("confirm");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeUsed, setTimeUsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const answerButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Start exam
  const startExam = useCallback(() => {
    if (!config) return;
    const exam = generateMockExam(config, necVersion as any);
    setQuestions(exam.questions);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setAnswers(new Map());
    setBookmarked(new Set());
    setTimeRemaining(config.timeLimit * 60);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [config, necVersion]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up — auto-finish
          clearInterval(timerRef.current!);
          setPhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Finish exam
  const finishExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeUsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    setPhase("finished");
  }, []);

  const currentQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx + 1 >= questions.length;

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    if (isSubmitted || !currentQuestion) return;
    haptic("tap");
    setSelectedAnswer(answerIndex);
    setIsSubmitted(true);
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, answerIndex));

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    haptic(isCorrect ? "success" : "error");
    if (isCorrect) {
      confetti({ particleCount: 60, spread: 55, origin: { x: 0.5, y: 0.7 }, colors: ["#F59E0B", "#10B981", "#A3FF00"] });
    }

  }, [isSubmitted, currentQuestion]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      finishExam();
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isLastQuestion, finishExam]);

  const handleToggleBookmark = useCallback(() => {
    if (!currentQuestion) return;
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  }, [currentQuestion]);

  if (!config) {
    return (
      <main className="min-h-screen bg-cream dark:bg-stone-950 flex items-center justify-center">
        <p className="text-muted-foreground">Exam not found</p>
      </main>
    );
  }

  // ─── Confirmation Screen ──────────────────────────────────────────────────
  if (phase === "confirm") {
    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <ReviewGridBackground />
        <div className="container mx-auto px-4 py-8 relative z-10 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <ClipboardCheck className="h-12 w-12 text-amber dark:text-sparky-green mx-auto mb-3" />
            <h1 className="text-2xl font-bold font-display text-foreground mb-1">{config.name}</h1>
            <p className="text-sm text-muted-foreground">Texas PSI Exam Format</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800 mb-6">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" />Questions</span>
                  <span className="text-sm font-bold text-foreground">{config.totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Time Limit</span>
                  <span className="text-sm font-bold text-foreground">{config.timeLimit} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Passing Score</span>
                  <span className="text-sm font-bold text-foreground">{config.passingScore}/{config.totalQuestions} ({config.passingPercent}%)</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Topic Breakdown</p>
            <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800">
              <CardContent className="p-4">
                <div className="space-y-1.5">
                  {config.topics.map((t) => (
                    <div key={t.topic} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{EXAM_TOPIC_LABELS[t.topic]}</span>
                      <span className="font-mono font-bold text-foreground">{t.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
            <SparkyMessage size="medium" message="The timer starts as soon as you click Begin. Treat this like the real exam — no breaks, no codebook lookups. Good luck!" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Button onClick={startExam} size="lg" className="w-full bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-2">
              <Play className="h-5 w-5" />Begin Exam
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Results Screen ────────────────────────────────────────────────────────
  if (phase === "finished") {
    // Calculate results per topic
    const topicResults: TopicResult[] = config.topics.map((t) => {
      const topicQs = questions.filter((q) => q.examTopic === t.topic);
      const correctCount = topicQs.filter((q) => answers.get(q.id) === q.correctAnswer).length;
      return { topic: t.topic, requested: t.count, filled: topicQs.length, correct: correctCount };
    });

    const totalCorrect = questions.filter((q) => answers.get(q.id) === q.correctAnswer).length;
    const totalAnswered = answers.size;
    const percentage = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
    const passed = totalCorrect >= config.passingScore;

    // Fire celebration if passed
    useEffect(() => {
      if (passed) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ["#F59E0B", "#10B981", "#A3FF00"] });
        setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { x: 0.3, y: 0.6 }, colors: ["#F59E0B", "#A3FF00"] }), 400);
        setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { x: 0.7, y: 0.6 }, colors: ["#10B981", "#F59E0B"] }), 800);
      }
    }, []);

    return (
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <ReviewGridBackground />
        <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
          {/* Pass/Fail Header */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="text-center mb-6">
            {passed ? (
              <CheckCircle2 className="h-16 w-16 text-emerald dark:text-sparky-green mx-auto mb-3" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />
            )}
            <h1 className="text-3xl font-bold font-display text-foreground mb-1">
              {passed ? "PASSED!" : "Not Yet"}
            </h1>
            <p className="text-muted-foreground">{config.name}</p>
          </motion.div>

          {/* Score Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className={`mb-6 ${passed ? "border-emerald/50 dark:border-sparky-green/50" : "border-red-500/30"}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <p className={`text-3xl font-bold tabular-nums ${passed ? "text-emerald dark:text-sparky-green" : "text-red-500"}`}>{totalCorrect}/{questions.length}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  <div>
                    <p className={`text-3xl font-bold tabular-nums ${passed ? "text-emerald dark:text-sparky-green" : "text-red-500"}`}>{percentage}%</p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-foreground">{formatTime(timeUsed || Math.floor((Date.now() - startTimeRef.current) / 1000))}</p>
                    <p className="text-xs text-muted-foreground">Time Used</p>
                  </div>
                </div>
                <div className="text-center pt-3 border-t border-border dark:border-stone-800">
                  <p className="text-sm text-muted-foreground">
                    Passing: {config.passingScore}/{config.totalQuestions} ({config.passingPercent}%)
                    {totalAnswered < questions.length && ` · ${questions.length - totalAnswered} unanswered`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Topic Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Strength & Weakness Report</p>
            <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800 mb-6">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {topicResults.map((tr) => {
                    const pct = tr.filled > 0 ? Math.round((tr.correct / tr.filled) * 100) : 0;
                    const color = pct >= 80 ? "text-emerald dark:text-sparky-green" : pct >= 60 ? "text-amber" : "text-red-500";
                    const barColor = pct >= 80 ? "bg-emerald dark:bg-sparky-green" : pct >= 60 ? "bg-amber" : "bg-red-500";
                    return (
                      <div key={tr.topic}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground truncate mr-2">{EXAM_TOPIC_LABELS[tr.topic]}</span>
                          <span className={`font-mono font-bold shrink-0 ${color}`}>{tr.correct}/{tr.filled}</span>
                        </div>
                        <div className="h-1.5 bg-muted-foreground/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sparky Message */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-6">
            <SparkyMessage size="medium" message={passed
              ? "You passed! Your hard work is paying off. Keep reviewing the topics where you scored below 80% to lock in that knowledge."
              : `You need ${config.passingScore - totalCorrect} more correct answers to pass. Focus on the red topics — that's where the points are hiding.`
            } />
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex gap-3 justify-center">
            <Button onClick={() => { setPhase("confirm"); setAnswers(new Map()); }} className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-2">
              Retake Exam
            </Button>
            <Button variant="outline" onClick={() => router.push("/mock-exam")}>
              Back to Exams
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Playing Screen ────────────────────────────────────────────────────────
  if (!currentQuestion) return <ReviewLoadingState />;

  const isBookmarked = bookmarked.has(currentQuestion.id);
  const progressPct = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;
  const timerWarning = timeRemaining <= 300; // 5 min warning
  const timerCritical = timeRemaining <= 60; // 1 min

  return (
    <motion.main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <ReviewGridBackground />
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* Desktop progress bar */}
        <div className="hidden md:block mb-4">
          <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark" />
          </div>
        </div>

        {/* Desktop nav bar */}
        <div className="hidden md:flex items-center justify-between gap-3 mb-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="default" className="gap-2"><ChevronLeft className="h-4 w-4" />End Exam</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Exam Early?</AlertDialogTitle>
                <AlertDialogDescription>You've answered {answers.size}/{questions.length} questions. Unanswered questions will be marked wrong.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                <AlertDialogAction onClick={finishExam}>End & See Results</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{currentIdx + 1} / {questions.length}</span>
            <span className={`text-sm font-bold font-mono px-2 py-1 rounded ${timerCritical ? "bg-red-500/15 text-red-500 animate-pulse" : timerWarning ? "bg-amber/15 text-amber" : "text-muted-foreground"}`}>
              <Clock className="h-3 w-3 inline mr-1" />{formatTime(timeRemaining)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="default" onClick={handleToggleBookmark} className={`gap-2 ${isBookmarked ? "text-amber border-amber" : ""}`}>
              {isBookmarked ? <Star className="h-4 w-4 fill-amber" /> : <StarOff className="h-4 w-4" />}
              {isBookmarked ? "Saved" : "Save"}
            </Button>
            {isSubmitted && (
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button onClick={handleNext} className="bg-amber hover:bg-amber/90 text-white gap-2 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                  {isLastQuestion ? "Finish Exam" : "Next"}<ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Question Card — no hints on mock exam */}
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          isSubmitted={isSubmitted}
          onSelectAnswer={handleSelectAnswer}
          necVersion={necVersion as any}
          answerButtonRefs={answerButtonRefs}
          hintsVisible={false}
          showHint={false}
          onToggleHint={() => {}}
        />

        {/* Mobile Next Button */}
        {isSubmitted && (
          <div className="flex justify-center mb-6 md:hidden">
            <motion.div whileTap={{ scale: 0.97 }} className="w-full">
              <Button onClick={handleNext} size="lg" className="bg-amber hover:bg-amber/90 text-white gap-2 w-full dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                {isLastQuestion ? "Finish Exam" : "Next Question"}<ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        )}

        {/* Desktop Next */}
        {isSubmitted && (
          <div className="hidden md:flex justify-end mb-6">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button onClick={handleNext} className="bg-amber hover:bg-amber/90 text-white gap-2 dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
                {isLastQuestion ? "Finish Exam" : "Next"}<ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        )}

        {/* Mobile progress + nav */}
        <div className="md:hidden mb-4">
          <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden mb-3">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-amber to-amber-light dark:from-sparky-green dark:to-sparky-green-dark" />
          </div>
          <div className="flex items-center justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9"><ChevronLeft className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Exam Early?</AlertDialogTitle>
                  <AlertDialogDescription>You've answered {answers.size}/{questions.length} questions.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue</AlertDialogCancel>
                  <AlertDialogAction onClick={finishExam}>End Exam</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${timerCritical ? "bg-red-500/15 text-red-500 animate-pulse" : timerWarning ? "bg-amber/15 text-amber" : "text-muted-foreground"}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={handleToggleBookmark} className={`h-9 w-9 ${isBookmarked ? "text-amber border-amber" : ""}`}>
              {isBookmarked ? <Star className="h-4 w-4 fill-amber" /> : <StarOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>

      </div>
    </motion.main>
  );
}

export default function MockExamTakingPage() {
  return (
    <Suspense fallback={<ReviewLoadingState />}>
      <MockExamContent />
    </Suspense>
  );
}
