"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

interface SessionTimeoutWarningProps {
  open: boolean;
  remainingTime: number; // seconds
  onContinue: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return `${secs} seconds`;
}

export function SessionTimeoutWarning({
  open,
  remainingTime,
  onContinue,
}: SessionTimeoutWarningProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber/20 dark:bg-sparky-green/20">
              <Clock className="h-6 w-6 text-amber dark:text-sparky-green" />
            </div>
            <AlertDialogTitle>Are you still there?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              You&apos;ve been inactive for a while. Your session will automatically
              end in <span className="font-bold text-amber dark:text-sparky-green">{formatTime(remainingTime)}</span> to
              save your progress.
            </p>
            <p className="text-sm">
              Click &quot;Continue Studying&quot; to keep your session active.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onContinue}
            className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
          >
            Continue Studying
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
