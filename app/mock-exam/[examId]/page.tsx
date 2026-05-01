"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import {
  ClipboardCheck, Clock, Target, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, ArrowRight, ArrowLeft, Loader2,
  Zap, Play, SkipForward,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SparkyMessage } from "@/components/sparky";
import { getExamConfig, generateMockExam, EXAM_TOPIC_LABELS } from "@/lib/mock-exam";
import { useNecVersion } from "@/lib/nec-version";
import { ReviewGridBackground, ReviewLoadingState } from "@/app/(review)/shared";
import type { Question } from "@/types/question";
import type { TopicResult } from "@/types/mock-exam";

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

  const [phase, setPhase] = useState<"confirm" | "playing" | "finished">("confirm");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeUsed, setTimeUsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const startExam = useCallback(() => {
    if (!config) return;
    const exam = generateMockExam(config, necVersion as any);
    setQuestions(exam.questions);
    setCurrentIdx(0);
    setAnswers(new Map());
    setTimeRemaining(config.timeLimit * 60);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [config, necVersion]);

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const finishExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeUsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    setPhase("finished");
  }, []);

  const currentQuestion = questions[currentIdx];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : undefined;
  const isFirst = currentIdx === 0;
  const isLast = currentIdx + 1 >= questions.length;
  const answeredCount = answers.size;

  const selectAnswer = useCallback((idx: number) => {
    if (!currentQuestion) return;
    haptic("tap");
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, idx));
  }, [currentQuestion]);

  const goTo = useCallback((idx: number) => {
    setCurrentIdx(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goNext = useCallback(() => { if (!isLast) goTo(currentIdx + 1); }, [isLast, currentIdx, goTo]);
  const goPrev = useCallback(() => { if (!isFirst) goTo(currentIdx - 1); }, [isFirst, currentIdx, goTo]);
  const skip = useCallback(() => { if (!isLast) goTo(currentIdx + 1); }, [isLast, currentIdx, goTo]);

  if (!config) {
    return <main className="min-h-screen bg-cream dark:bg-stone-950 flex items-center justify-center"><p className="text-muted-foreground">Exam not found</p></main>;
  }

  // ─── Confirm ──────────────────────────────────────────────────────────────
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
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" />Questions</span><span className="text-sm font-bold text-foreground">{config.totalQuestions}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Time Limit</span><span className="text-sm font-bold text-foreground">{config.timeLimit} minutes</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Passing Score</span><span className="text-sm font-bold text-foreground">{config.passingScore}/{config.totalQuestions} ({config.passingPercent}%)</span></div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Topic Breakdown</p>
            <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800">
              <CardContent className="p-4"><div className="space-y-1.5">{config.topics.map((t) => (<div key={t.topic} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{EXAM_TOPIC_LABELS[t.topic]}</span><span className="font-mono font-bold text-foreground">{t.count}</span></div>))}</div></CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
            <SparkyMessage size="medium" message="The timer starts as soon as you click Begin. You can skip questions and come back to them. No feedback until you submit. Good luck!" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Button onClick={startExam} size="lg" className="w-full bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-2"><Play className="h-5 w-5" />Begin Exam</Button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Results ──────────────────────────────────────────────────────────────
  if (phase === "finished") {
    const topicResults: TopicResult[] = config.topics.map((t) => {
      const topicQs = questions.filter((q) => q.examTopic === t.topic);
      const correctCount = topicQs.filter((q) => answers.get(q.id) === q.correctAnswer).length;
      return { topic: t.topic, requested: t.count, filled: topicQs.length, correct: correctCount };
    });
    const totalCorrect = questions.filter((q) => answers.get(q.id) === q.correctAnswer).length;
    const totalAnswered = answers.size;
    const percentage = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
    const passed = totalCorrect >= config.passingScore;

    // eslint-disable-next-line react-hooks/rules-of-hooks
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
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="text-center mb-6">
            {passed ? <CheckCircle2 className="h-16 w-16 text-emerald dark:text-sparky-green mx-auto mb-3" /> : <XCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />}
            <h1 className="text-3xl font-bold font-display text-foreground mb-1">{passed ? "PASSED!" : "Not Yet"}</h1>
            <p className="text-muted-foreground">{config.name}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className={`mb-6 ${passed ? "border-emerald/50 dark:border-sparky-green/50" : "border-red-500/30"}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div><p className={`text-3xl font-bold tabular-nums ${passed ? "text-emerald dark:text-sparky-green" : "text-red-500"}`}>{totalCorrect}/{questions.length}</p><p className="text-xs text-muted-foreground">Score</p></div>
                  <div><p className={`text-3xl font-bold tabular-nums ${passed ? "text-emerald dark:text-sparky-green" : "text-red-500"}`}>{percentage}%</p><p className="text-xs text-muted-foreground">Accuracy</p></div>
                  <div><p className="text-3xl font-bold tabular-nums text-foreground">{formatTime(timeUsed || Math.floor((Date.now() - startTimeRef.current) / 1000))}</p><p className="text-xs text-muted-foreground">Time Used</p></div>
                </div>
                <div className="text-center pt-3 border-t border-border dark:border-stone-800">
                  <p className="text-sm text-muted-foreground">Passing: {config.passingScore}/{config.totalQuestions} ({config.passingPercent}%){totalAnswered < questions.length && ` · ${questions.length - totalAnswered} unanswered`}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Strength & Weakness Report</p>
            <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800 mb-6">
              <CardContent className="p-4"><div className="space-y-2">{topicResults.map((tr) => { const pct = tr.filled > 0 ? Math.round((tr.correct / tr.filled) * 100) : 0; const color = pct >= 80 ? "text-emerald dark:text-sparky-green" : pct >= 60 ? "text-amber" : "text-red-500"; const barColor = pct >= 80 ? "bg-emerald dark:bg-sparky-green" : pct >= 60 ? "bg-amber" : "bg-red-500"; return (<div key={tr.topic}><div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground truncate mr-2">{EXAM_TOPIC_LABELS[tr.topic]}</span><span className={`font-mono font-bold shrink-0 ${color}`}>{tr.correct}/{tr.filled}</span></div><div className="h-1.5 bg-muted-foreground/10 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} /></div></div>); })}</div></CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-6">
            <SparkyMessage size="medium" message={passed ? "You passed! Keep reviewing the topics where you scored below 80%." : `You need ${config.passingScore - totalCorrect} more correct answers to pass. Focus on the red topics.`} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex gap-3 justify-center">
            <Button onClick={() => { setPhase("confirm"); setAnswers(new Map()); }} className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-2">Retake Exam</Button>
            <Button variant="outline" onClick={() => router.push("/mock-exam")}>Back to Exams</Button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ─── Playing ──────────────────────────────────────────────────────────────
  if (!currentQuestion) return <ReviewLoadingState />;

  const timerWarning = timeRemaining <= 300;
  const timerCritical = timeRemaining <= 60;

  return (
    <main className="relative min-h-screen bg-cream dark:bg-stone-950">
      <ReviewGridBackground />
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">

        {/* Timer + counter bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><ChevronLeft className="h-3.5 w-3.5" />End Exam</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>End Exam Early?</AlertDialogTitle><AlertDialogDescription>You've answered {answeredCount}/{questions.length} questions. Unanswered questions will be marked wrong.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Continue</AlertDialogCancel><AlertDialogAction onClick={finishExam}>End & See Results</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{answeredCount} answered</span>
          </div>

          <span className={`text-sm font-bold font-mono px-2.5 py-1 rounded-lg ${timerCritical ? "bg-red-500/15 text-red-500 animate-pulse" : timerWarning ? "bg-amber/15 text-amber" : "bg-muted text-muted-foreground"}`}>
            <Clock className="h-3.5 w-3.5 inline mr-1" />{formatTime(timeRemaining)}
          </span>
        </div>

        {/* Question map — scrollable row of numbered dots */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max px-1 py-1">
            {questions.map((q, i) => {
              const isAnswered = answers.has(q.id);
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-7 h-7 rounded text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? "bg-amber text-white dark:bg-sparky-green dark:text-stone-950 ring-2 ring-amber/50 dark:ring-sparky-green/50"
                      : isAnswered
                        ? "bg-emerald/20 text-emerald dark:bg-sparky-green/20 dark:text-sparky-green border border-emerald/30 dark:border-sparky-green/30"
                        : "bg-muted text-muted-foreground border border-border dark:border-stone-700"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber dark:bg-sparky-green" />Current</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald/20 dark:bg-sparky-green/20 border border-emerald/30 dark:border-sparky-green/30" />Answered</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border dark:border-stone-700" />Unanswered</span>
        </div>

        {/* Question card — no feedback, just selection */}
        <Card className="bg-card dark:bg-stone-900/50 border-border dark:border-stone-800 mb-6">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-mono mb-2">Question {currentIdx + 1}</p>
            <p className="text-base font-medium text-foreground leading-relaxed">
              {currentQuestion.questionText}
            </p>
          </CardContent>
        </Card>

        {/* Answer options — selection only, no correct/incorrect */}
        <div className="space-y-2 mb-6">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = currentAnswer === idx;
            return (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-sm cursor-pointer ${
                  isSelected
                    ? "border-amber bg-amber/10 text-foreground dark:border-sparky-green dark:bg-sparky-green/10 font-medium"
                    : "border-border dark:border-stone-700 text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full border text-[10px] font-bold shrink-0 mt-0.5 ${
                    isSelected
                      ? "border-amber bg-amber text-white dark:border-sparky-green dark:bg-sparky-green dark:text-stone-950"
                      : "border-muted-foreground/40 text-muted-foreground"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation: Prev / Skip / Next / Submit */}
        <div className="flex items-center justify-between gap-2 mb-8">
          <Button variant="outline" onClick={goPrev} disabled={isFirst} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />Prev
          </Button>

          <Button variant="ghost" onClick={skip} disabled={isLast} className="gap-1.5 text-muted-foreground">
            <SkipForward className="h-4 w-4" />Skip
          </Button>

          {isLast && answeredCount === questions.length ? (
            <Button onClick={finishExam} className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-1.5">
              Submit Exam<CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : isLast ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-1.5">
                  Submit Exam<CheckCircle2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Submit Exam?</AlertDialogTitle><AlertDialogDescription>You've answered {answeredCount}/{questions.length} questions. {questions.length - answeredCount > 0 ? `${questions.length - answeredCount} unanswered question(s) will be marked wrong.` : ""}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Go Back</AlertDialogCancel><AlertDialogAction onClick={finishExam}>Submit</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={goNext} className="bg-amber hover:bg-amber/90 text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950 gap-1.5">
              Next<ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function MockExamTakingPage() {
  return (
    <Suspense fallback={<ReviewLoadingState />}>
      <MockExamContent />
    </Suspense>
  );
}
