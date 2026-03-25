"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FeedbackType = "bug" | "improvement" | "confusing";

const feedbackOptions: { type: FeedbackType; label: string; icon: typeof Bug; description: string }[] = [
  { type: "bug", label: "Report a bug", icon: Bug, description: "Something isn't working right" },
  { type: "improvement", label: "Suggest an improvement", icon: Lightbulb, description: "An idea to make things better" },
  { type: "confusing", label: "Something's confusing", icon: HelpCircle, description: "Content or UI that doesn't make sense" },
];

export function FeedbackWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"select" | "compose">("select");
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setIsOpen(false);
    setStep("select");
    setSelectedType(null);
    setMessage("");
  };

  const handleTypeSelect = (type: FeedbackType) => {
    setSelectedType(type);
    setStep("compose");
  };

  const handleSubmit = async () => {
    if (!message.trim() || !selectedType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          message: message.trim(),
          page: pathname,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      const data = await response.json();
      const wattsMsg = data.wattsAwarded
        ? ` You earned ${data.wattsAwarded}W!`
        : "";
      toast.success(`Thanks for your feedback!${wattsMsg} It helps us improve SparkyPass.`);
      // Dispatch event so WattsCounter updates
      if (data.wattsAwarded) {
        window.dispatchEvent(new CustomEvent("watts-updated"));
      }
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-amber text-white dark:bg-sparky-green dark:text-stone-950 shadow-lg hover:shadow-xl transition-shadow px-4 py-2.5 font-medium text-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <MessageSquarePlus className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{isOpen ? "Close" : "Feedback"}</span>
      </motion.button>

      {/* Feedback panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[4.5rem] right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] rounded-xl border border-border dark:border-stone-800 bg-card dark:bg-stone-900 shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border dark:border-stone-800 bg-muted/30 dark:bg-stone-800/50">
              <h3 className="font-semibold text-sm text-foreground">
                {step === "select" ? "How can we improve?" : feedbackOptions.find((o) => o.type === selectedType)?.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "select"
                  ? "Your feedback shapes what gets built next."
                  : "Tell us more — be as specific as you can."}
              </p>
            </div>

            {/* Content */}
            <div className="p-3">
              {step === "select" ? (
                <div className="space-y-1.5">
                  {feedbackOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        onClick={() => handleTypeSelect(option.type)}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted dark:hover:bg-stone-800 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-amber/10 dark:bg-sparky-green/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-amber dark:text-sparky-green" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe what happened or what you'd like to see..."
                    rows={4}
                    maxLength={2000}
                    autoFocus
                    className="w-full rounded-lg border border-border dark:border-stone-700 bg-background dark:bg-stone-800 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber/50 dark:focus:ring-sparky-green/50 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setStep("select");
                        setMessage("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      &larr; Back
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {message.length}/2000
                      </span>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!message.trim() || isSubmitting}
                        className="bg-amber hover:bg-amber-dark text-white dark:bg-sparky-green dark:hover:bg-sparky-green-dark dark:text-stone-950"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5 mr-1" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Page context */}
            <div className="px-4 py-2 border-t border-border dark:border-stone-800 bg-muted/20 dark:bg-stone-800/30">
              <p className="text-[10px] text-muted-foreground truncate">
                Page: {pathname}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
