"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  Flag,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";
import type { Question } from "@/types/question";

interface ExamResults {
  examId: string;
  examTitle: string;
  questions: Question[];
  answers: Record<string, number | null>;
  correct: number;
  total: number;
  totalAnswered: number;
  score: number;
  timeTaken: number;
  flagged: string[];
}

export default function ExamResultsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [results, setResults] = useState<ExamResults | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get results from sessionStorage
    const storedResults = sessionStorage.getItem("examResults");
    if (storedResults) {
      const parsed = JSON.parse(storedResults) as ExamResults;
      if (parsed.examId === examId) {
        setResults(parsed);
      }
    }
    setIsLoading(false);
  }, [examId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </main>
    );
  }

  if (!results) {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">No Results Found</h1>
        <p className="text-muted-foreground mb-6">
          It looks like you haven&apos;t completed an exam yet.
        </p>
        <Link href="/mock-exam">
          <Button>Go to Mock Exams</Button>
        </Link>
      </main>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Outstanding! You're exam-ready!";
    if (score >= 80) return "Great job! You're on the right track!";
    if (score >= 70) return "Good effort! A bit more practice and you'll ace it!";
    if (score >= 60) return "Keep studying! You're making progress!";
    return "Don't give up! Every attempt makes you stronger!";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald dark:text-sparky-green";
    if (score >= 70) return "text-amber";
    return "text-red-500";
  };

  const passed = results.score >= 70;

  return (
    <main className="relative bg-cream dark:bg-stone-950 container mx-auto px-4 py-8 max-w-3xl">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center mb-8"
      >
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all duration-300 ${
            passed ? "bg-emerald/10 dark:bg-sparky-green/10 dark:shadow-[0_0_15px_rgba(163,255,0,0.35)]" : "bg-amber/10 dark:shadow-[0_0_15px_rgba(245,158,11,0.35)]"
          }`}
        >
          <Trophy className={`h-10 w-10 ${passed ? "text-emerald dark:text-sparky-green" : "text-amber"}`} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
          {results.examTitle} Complete!
        </h1>
        <p className="text-muted-foreground">{getScoreMessage(results.score)}</p>
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 mb-6"
      >
        <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <p className={`text-6xl font-bold ${getScoreColor(results.score)}`}>
                {results.score}%
              </p>
              <p className="text-muted-foreground mt-2">
                {passed ? "PASSED" : "Keep Practicing"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-emerald dark:text-sparky-green mb-1">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-2xl font-bold">{results.correct}</span>
                </div>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                  <XCircle className="h-5 w-5" />
                  <span className="text-2xl font-bold">
                    {results.totalAnswered - results.correct}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-amber mb-1">
                  <Clock className="h-5 w-5" />
                  <span className="text-2xl font-bold">{formatTime(results.timeTaken)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="relative z-10 mb-6"
      >
        <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions Answered</span>
                <span className="font-medium">
                  {results.totalAnswered} / {results.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skipped</span>
                <span className="font-medium">{results.total - results.totalAnswered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flagged for Review</span>
                <span className="font-medium">{results.flagged.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accuracy</span>
                <span className="font-medium">
                  {results.totalAnswered > 0
                    ? Math.round((results.correct / results.totalAnswered) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Question Details Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 mb-6"
      >
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Answered Questions
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Review Answered Questions ({results.totalAnswered})
            </>
          )}
        </Button>
      </motion.div>

      {/* Question Details */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="relative z-10 space-y-4 mb-8"
        >
          {results.questions
            .filter((q) => results.answers[q.id] !== null && results.answers[q.id] !== undefined)
            .map((question, index) => {
            const userAnswer = results.answers[question.id];
            const isCorrect = userAnswer === question.correctAnswer;
            const wasFlagged = results.flagged.includes(question.id);

            return (
              <Card
                key={question.id}
                className={`${
                  isCorrect
                    ? "border-emerald/30 bg-emerald/5 dark:border-sparky-green/30 dark:bg-sparky-green/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Question {index + 1}
                      {wasFlagged && (
                        <Flag className="h-3 w-3 inline ml-2 text-red-500 fill-current" />
                      )}
                    </CardTitle>
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald dark:text-sparky-green" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-3">{question.questionText}</p>

                  <div className="space-y-2 text-sm">
                    {question.options.map((option, optIndex) => {
                      const isUserAnswer = userAnswer === optIndex;
                      const isCorrectAnswer = question.correctAnswer === optIndex;

                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrectAnswer
                              ? "bg-emerald/10 text-emerald border-emerald/50 dark:bg-sparky-green/10 dark:text-sparky-green dark:border-sparky-green/50"
                              : isUserAnswer && !isCorrect
                              ? "bg-red-500/10 text-red-500 border-red-500/50"
                              : "text-muted-foreground border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              {option}
                            </div>
                            <div className="flex items-center gap-2">
                              {isCorrectAnswer && (
                                <span className="flex items-center gap-1 text-xs font-medium">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Correct
                                </span>
                              )}
                              {isUserAnswer && !isCorrect && (
                                <span className="flex items-center gap-1 text-xs font-medium">
                                  <XCircle className="h-4 w-4" />
                                  Your answer
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {question.explanation && (
                    <div className="mt-3 p-3 bg-muted/50 dark:bg-stone-800/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                      {question.necReference && (
                        <p className="text-xs text-purple dark:text-purple-light mt-1">
                          Reference: {question.necReference}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* Sparky Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="relative z-10 mb-8"
      >
        <SparkyMessage
          size="medium"
          message={
            passed
              ? "Fantastic work! You're showing real progress. Keep up the momentum and you'll crush the real exam!"
              : "Every practice test is a learning opportunity! Review the questions you missed and try again. You're building the knowledge you need!"
          }
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Link href={`/mock-exam/${examId}`}>
          <Button variant="outline" className="w-full sm:w-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Exam
          </Button>
        </Link>
        <Link href="/mock-exam">
          <Button className="w-full sm:w-auto bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950">
            <Home className="h-4 w-4 mr-2" />
            Back to Mock Exams
          </Button>
        </Link>
      </motion.div>
    </main>
  );
}
