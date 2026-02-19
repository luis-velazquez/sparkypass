"use client";

import { motion } from "framer-motion";
import { Target, Zap, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkyMessage } from "@/components/sparky";

export interface ExamCountdownProps {
  targetExamDate: Date | null;
  totalQuestionsAnswered: number;
  totalQuestionsInBank: number;
  className?: string;
}

/**
 * Get Sparky's message based on days until exam
 */
function getSparkyExamMessage(daysUntilExam: number | null): string {
  if (daysUntilExam === null) {
    return "Set your target exam date to get personalized countdown and study recommendations!";
  }

  if (daysUntilExam < 0) {
    return "Your exam date has passed! How did it go? Update your target date if you're planning to retake, or celebrate your success!";
  }

  if (daysUntilExam === 0) {
    return "Today's the day! You've put in the work, now trust yourself. Take deep breaths, read each question carefully, and remember - you've got this!";
  }

  if (daysUntilExam === 1) {
    return "One more day! Get a good night's sleep, eat a solid breakfast tomorrow, and arrive early. You're as ready as you'll ever be!";
  }

  if (daysUntilExam <= 3) {
    return "The final stretch! Focus on reviewing your bookmarked questions and weak areas. Light study only - no cramming!";
  }

  if (daysUntilExam <= 7) {
    return "One week to go! This is a great time to take a full mock exam and review any trouble spots. You're doing great!";
  }

  if (daysUntilExam <= 14) {
    return "Two weeks out! Keep up your daily practice and focus on understanding the 'why' behind code requirements. Consistency is key!";
  }

  if (daysUntilExam <= 30) {
    return "A month to go - plenty of time to sharpen your skills! Make sure you're covering all the major NEC articles in your study plan.";
  }

  return "You have plenty of time to prepare! Stay consistent with daily practice and you'll be more than ready when exam day arrives.";
}

/**
 * Calculate days until exam
 */
function calculateDaysUntilExam(targetDate: Date | null): number | null {
  if (!targetDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format the exam date for display
 */
function formatExamDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ExamCountdown({
  targetExamDate,
  totalQuestionsAnswered,
  totalQuestionsInBank,
  className,
}: ExamCountdownProps) {
  const daysUntilExam = calculateDaysUntilExam(targetExamDate);
  const sparkyMessage = getSparkyExamMessage(daysUntilExam);

  // Calculate percentage of question bank completed
  // Using unique questions answered, capped at 100%
  const completionPercentage = totalQuestionsInBank > 0
    ? Math.min(100, Math.round((totalQuestionsAnswered / totalQuestionsInBank) * 100))
    : 0;

  // Determine urgency color based on days remaining
  const getUrgencyColor = () => {
    if (daysUntilExam === null) return "text-muted-foreground";
    if (daysUntilExam < 0) return "text-muted-foreground";
    if (daysUntilExam <= 3) return "text-red-500";
    if (daysUntilExam <= 7) return "text-amber";
    return "text-purple dark:text-purple-light";
  };

  const getProgressColor = () => {
    if (completionPercentage >= 80) return "bg-emerald dark:bg-sparky-green";
    if (completionPercentage >= 50) return "bg-amber";
    return "bg-purple";
  };

  return (
    <div className={className}>
      <Card className="border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 transition-all duration-300 hover:border-amber/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] dark:hover:border-sparky-green/25 dark:hover:shadow-[0_0_20px_rgba(163,255,0,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple dark:text-purple-light" />
            Exam Countdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {targetExamDate ? (
            <>
              {/* Days countdown display */}
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-purple-soft dark:bg-purple/10 dark:shadow-[0_0_15px_rgba(139,92,246,0.35)] shrink-0 transition-all duration-300">
                  <Zap className="h-10 w-10 text-purple dark:text-purple-light" />
                </div>
                <div className="min-w-0">
                  <p className={`text-4xl font-bold ${getUrgencyColor()}`}>
                    {daysUntilExam !== null && daysUntilExam >= 0
                      ? daysUntilExam
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {daysUntilExam !== null && daysUntilExam >= 0
                      ? `${daysUntilExam === 1 ? "day" : "days"} until your exam!`
                      : "Exam date has passed"}
                  </p>
                </div>
              </div>

              {/* Exam date display */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 dark:bg-stone-800/50 rounded-lg p-3">
                <Calendar className="h-4 w-4 shrink-0 dark:text-purple-light" />
                <span className="truncate">{formatExamDate(targetExamDate)}</span>
              </div>

              {/* Question bank completion progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald dark:text-sparky-green" />
                    <span className="text-muted-foreground">
                      Question Bank Progress
                    </span>
                  </div>
                  <span className="font-medium text-foreground">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-muted dark:bg-stone-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${getProgressColor()}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalQuestionsAnswered} of {totalQuestionsInBank} questions practiced
                </p>
              </div>

              {/* Sparky message */}
              <div className="pt-2">
                <SparkyMessage size="small" message={sparkyMessage} />
              </div>

              {/* Edit exam date link */}
              <div className="pt-2 border-t">
                <Link href="/profile" className="text-sm text-purple dark:text-purple-light hover:underline">
                  Update exam date →
                </Link>
              </div>
            </>
          ) : (
            /* No exam date set state */
            <div className="text-center py-4 space-y-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 dark:bg-stone-800/50 mx-auto">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground mb-4">
                  Set your target exam date to see the countdown and get personalized study recommendations!
                </p>
                <Link href="/profile">
                  <Button>Set Exam Date</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
