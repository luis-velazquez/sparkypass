"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calculator,
  Home,
  Zap,
  CheckCircle2,
  BookOpen,
  Plus,
  Loader2,
} from "lucide-react";

import { SparkyMessage } from "@/components/sparky";
import { MiniCalculator } from "../_shared/MiniCalculator";
import {
  HOUSE_SCENARIOS,
  CALCULATION_STEPS,
  SPARKY_MESSAGES,
  getRandomMessage,
  getAccountedApplianceIds,
  getFilteredSteps,
  TOTAL_VA_COMPONENT_STEPS,
  getQuickReferenceItems,
  isQuickRefCovered,
  STEP_APPLIANCE_MAP,
  getDwellingConductorSize,
  getDwellingAluminumSize,
  getGECSize,
  conductorCodeToLabel,
  getHvacMotorSubStep,
  getFixedMotorSubSteps,
  resolveTitle,
  resolveSparkyPrompt,
  resolveNecReference,
  resolveFormula,
  type HouseScenario,
} from "./calculator-data";
import { useNecVersion } from "@/lib/nec-version";
import type { CalculatorState, SavedProgress } from "../_shared/types";
import { fireConfetti, formatNumberWithCommas, parseFormattedNumber, getHintText } from "../_shared/utils";
import { CollapsibleCard } from "../_shared/CollapsibleCard";
import { CompletionScreen } from "../_shared/CompletionScreen";
import { CompletionSummaryCard } from "../_shared/CompletionSummaryCard";
import { StepInputArea } from "../_shared/StepInputArea";
import { CalculatorPageLayout } from "../_shared/CalculatorPageLayout";

// Category lookup for equipment grouping
const APPLIANCE_CATEGORY: Record<string, string> = {
  "small-appliance-1": "required",
  "small-appliance-2": "required",
  "laundry": "required",
  "range": "cooking",
  "cooktop": "cooking",
  "wall-oven": "cooking",
  "dryer": "dryer",
  "water-heater": "fixed",
  "dishwasher": "fixed",
  "disposal": "fixed",
  "microwave": "fixed",
  "wine-cooler": "fixed",
  "pool-pump": "fixed",
  "hot-tub": "fixed",
  "ev-charger": "other",
  "ac": "hvac",
  "heat": "hvac",
};

const CATEGORY_LABELS: Record<string, string> = {
  building: "Building Info",
  required: "Required Circuits",
  cooking: "Range / Cooking",
  dryer: "Dryer",
  fixed: "Fixed Appliances",
  hvac: "HVAC",
  other: "Other Loads",
};

const CATEGORY_ORDER = ["building", "required", "cooking", "dryer", "fixed", "hvac", "other"];

const STORAGE_KEY = "sparkypass-load-calculator";

function ResidentialCalculatorInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdRef = useRef<string | null>(null);
  const { necVersion } = useNecVersion();

  const [state, setState] = useState<CalculatorState<HouseScenario>>({
    selectedScenario: null,
    currentStepIndex: 0,
    answers: {},
    userInput: "",
    showHint: false,
    lastAnswerCorrect: null,
    sparkyMessage: SPARKY_MESSAGES.welcome,
    isComplete: false,
    hvacSubStepIndex: 0,
    hvacMotorVA: undefined,
    fixedMotorSubStepIndex: 0,
    fixedMotorVAs: undefined,
  });

  const hasPlayedConfetti = useRef(false);
  const hasInitialized = useRef(false);

  // Filter steps based on selected scenario's equipment
  const activeSteps = useMemo(() =>
    state.selectedScenario ? getFilteredSteps(state.selectedScenario) : CALCULATION_STEPS,
    [state.selectedScenario]
  );

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fire confetti when calculation is complete
  useEffect(() => {
    if (state.isComplete && !hasPlayedConfetti.current) {
      hasPlayedConfetti.current = true;
      fireConfetti();
    }
    // Reset flag when starting over
    if (!state.isComplete) {
      hasPlayedConfetti.current = false;
    }
  }, [state.isComplete]);

  // Initialize from URL params on mount
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "loading" || hasInitialized.current) return;
    hasInitialized.current = true;

    const scenarioParam = searchParams.get("scenario");
    const resumeParam = searchParams.get("resume");

    if (resumeParam === "true") {
      // Resume from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as SavedProgress;
          const scenario = HOUSE_SCENARIOS.find(s => s.id === parsed.scenarioId);
          if (scenario) {
            const steps = getFilteredSteps(scenario);
            const stepIndex = parsed.currentStepIndex || 0;
            const currentStepId = steps[stepIndex]?.id;
            const hvacSubIdx = parsed.hvacSubStepIndex || 0;
            const fixedSubIdx = parsed.fixedMotorSubStepIndex || 0;

            let sparkyMessage: string;
            if (parsed.isComplete) {
              sparkyMessage = SPARKY_MESSAGES.complete;
            } else if (currentStepId === "hvac" && hvacSubIdx === 0) {
              const hvacSub = getHvacMotorSubStep(scenario);
              sparkyMessage = hvacSub?.sparkyPrompt || (steps[stepIndex] ? resolveSparkyPrompt(steps[stepIndex], scenario, necVersion) : "");
            } else if (currentStepId === "fixed-appliances") {
              const fixedSubs = getFixedMotorSubSteps(scenario);
              if (fixedSubIdx < fixedSubs.length) {
                sparkyMessage = fixedSubs[fixedSubIdx].sparkyPrompt;
              } else {
                sparkyMessage = steps[stepIndex] ? resolveSparkyPrompt(steps[stepIndex], scenario, necVersion) : "";
              }
            } else {
              sparkyMessage = steps[stepIndex] ? resolveSparkyPrompt(steps[stepIndex], scenario, necVersion) : "";
            }

            setState(prev => ({
              ...prev,
              selectedScenario: scenario,
              currentStepIndex: stepIndex,
              answers: parsed.answers || {},
              isComplete: parsed.isComplete || false,
              sparkyMessage,
              hvacSubStepIndex: hvacSubIdx,
              hvacMotorVA: parsed.hvacMotorVA,
              fixedMotorSubStepIndex: fixedSubIdx,
              fixedMotorVAs: parsed.fixedMotorVAs,
            }));
            return;
          }
        } catch { /* ignore */ }
      }
      // Fallback: no valid saved progress
      router.replace("/load-calculator");
      return;
    }

    if (scenarioParam) {
      const scenario = HOUSE_SCENARIOS.find(s => s.id === scenarioParam);
      if (scenario) {
        handleSelectScenarioInternal(scenario);
        return;
      }
    }

    // No valid params — redirect to landing page
    router.replace("/load-calculator");
  }, [status, router, searchParams]);

  // Save progress to localStorage
  const saveProgress = useCallback((currentState: CalculatorState<HouseScenario>) => {
    if (currentState.selectedScenario) {
      const toSave: SavedProgress = {
        scenarioId: currentState.selectedScenario.id,
        currentStepIndex: currentState.currentStepIndex,
        answers: currentState.answers,
        isComplete: currentState.isComplete,
        hvacSubStepIndex: currentState.hvacSubStepIndex,
        hvacMotorVA: currentState.hvacMotorVA,
        fixedMotorSubStepIndex: currentState.fixedMotorSubStepIndex,
        fixedMotorVAs: currentState.fixedMotorVAs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, []);

  // Save & Exit — saves to localStorage and navigates to landing page
  const handleSaveAndExit = useCallback(() => {
    saveProgress(state);
    router.push("/load-calculator");
  }, [state, saveProgress, router]);

  const handleSelectScenarioInternal = useCallback((scenario: HouseScenario) => {
    // Clear any saved progress when starting a new scenario
    localStorage.removeItem(STORAGE_KEY);

    const steps = getFilteredSteps(scenario);
    const newState: CalculatorState<HouseScenario> = {
      selectedScenario: scenario,
      currentStepIndex: 0,
      answers: {},
      userInput: "",
      showHint: false,
      lastAnswerCorrect: null,
      sparkyMessage: resolveSparkyPrompt(steps[0], scenario, necVersion),
      isComplete: false,
      hvacSubStepIndex: 0,
      hvacMotorVA: undefined,
      fixedMotorSubStepIndex: 0,
      fixedMotorVAs: undefined,
    };
    setState(newState);

    // Track session for recent activity
    if (session?.user) {
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionType: "load_calculator" }),
      })
        .then(res => res.json())
        .then(data => { sessionIdRef.current = data.sessionId; })
        .catch(() => {});
    }
  }, [session?.user, necVersion]);

  // Handle answer submission
  const handleSubmitAnswer = useCallback(() => {
    if (!state.selectedScenario || state.isComplete) return;

    const currentStep = activeSteps[state.currentStepIndex];
    const userAnswer = currentStep.parseInput
      ? currentStep.parseInput(state.userInput)
      : parseFormattedNumber(state.userInput);

    if (isNaN(userAnswer)) {
      setState(prev => ({
        ...prev,
        sparkyMessage: "Please enter a valid number!",
      }));
      return;
    }

    // ─── HVAC sub-step branch (220.60 motor conversion) ────────────────────
    if (currentStep.id === "hvac" && (state.hvacSubStepIndex ?? 0) === 0) {
      const hvacSub = getHvacMotorSubStep(state.selectedScenario);
      if (hvacSub) {
        const isCorrect = Math.abs(userAnswer - hvacSub.expectedVA) <= 50;
        if (isCorrect) {
          const heat = state.selectedScenario.appliances.find(a => a.id === "heat");
          const heatWatts = heat?.watts || 0;
          const newState: CalculatorState<HouseScenario> = {
            ...state,
            userInput: "",
            showHint: false,
            lastAnswerCorrect: true,
            hvacSubStepIndex: 1,
            hvacMotorVA: userAnswer,
            sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.correct)} The A/C is ${userAnswer.toLocaleString()} VA. Now multiply by 125% for the motor continuous load factor, compare with the ${heatWatts.toLocaleString()} W heating load, and enter the larger value.`,
          };
          setState(newState);
        } else {
          setState(prev => ({
            ...prev,
            lastAnswerCorrect: false,
            sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.incorrect)} The correct answer is ${hvacSub.expectedVA.toLocaleString()}. Check the hint for details!`,
            showHint: false,
          }));
        }
        return;
      }
    }

    // ─── Fixed-appliance motor sub-step branch ────────────────────────────
    if (currentStep.id === "fixed-appliances") {
      const fixedSubs = getFixedMotorSubSteps(state.selectedScenario);
      const fixedIdx = state.fixedMotorSubStepIndex ?? 0;
      if (fixedIdx < fixedSubs.length) {
        const sub = fixedSubs[fixedIdx];
        const isCorrect = Math.abs(userAnswer - sub.expectedVA) <= 50;
        if (isCorrect) {
          const newVAs = { ...(state.fixedMotorVAs || {}), [sub.motorName]: userAnswer };
          const nextIdx = fixedIdx + 1;
          const nextSub = fixedSubs[nextIdx];
          const newState: CalculatorState<HouseScenario> = {
            ...state,
            userInput: "",
            showHint: false,
            lastAnswerCorrect: true,
            fixedMotorSubStepIndex: nextIdx,
            fixedMotorVAs: newVAs,
            sparkyMessage: nextSub
              ? `${getRandomMessage(SPARKY_MESSAGES.correct)} The ${sub.motorName} is ${userAnswer.toLocaleString()} VA. ${nextSub.sparkyPrompt}`
              : `${getRandomMessage(SPARKY_MESSAGES.correct)} The ${sub.motorName} is ${userAnswer.toLocaleString()} VA. Now add up all the fixed appliances and apply the 75% demand factor if you have 4 or more.`,
          };
          setState(newState);
        } else {
          setState(prev => ({
            ...prev,
            lastAnswerCorrect: false,
            sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.incorrect)} The correct answer is ${sub.expectedVA.toLocaleString()}. Check the hint for details!`,
            showHint: false,
          }));
        }
        return;
      }
    }

    // ─── Normal step handling ────────────────────────────────────────────
    const expectedAnswer = currentStep.expectedAnswer?.(state.selectedScenario, state.answers) ?? 0;
    const isCorrect = currentStep.validateAnswer?.(userAnswer, expectedAnswer) ?? false;

    const answerToStore = currentStep.storedAnswer
      ? currentStep.storedAnswer(state.selectedScenario, state.answers, userAnswer)
      : userAnswer;
    const newAnswers = { ...state.answers, [currentStep.id]: answerToStore };
    const isLastStep = state.currentStepIndex === activeSteps.length - 1;

    if (isCorrect) {
      const storedNote = answerToStore !== userAnswer
        ? ` That rounds up to a ${answerToStore.toLocaleString()}A standard service size.`
        : "";

      if (isLastStep) {
        const completeState: CalculatorState<HouseScenario> = {
          ...state,
          answers: newAnswers,
          lastAnswerCorrect: true,
          sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.correct)}${storedNote} ${SPARKY_MESSAGES.complete}`,
          isComplete: true,
          userInput: "",
          showHint: false,
        };
        setState(completeState);

        // End session for recent activity tracking
        if (sessionIdRef.current) {
          fetch("/api/sessions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              questionsAnswered: activeSteps.length,
              questionsCorrect: activeSteps.length,
            }),
          }).catch(() => {});
          sessionIdRef.current = null;
        }
      } else {
        const nextStep = activeSteps[state.currentStepIndex + 1];
        // If advancing to HVAC step, use the motor sub-step prompt instead
        const hvacSub = nextStep.id === "hvac" && state.selectedScenario ? getHvacMotorSubStep(state.selectedScenario) : null;
        // If advancing to fixed-appliances step, check for motor sub-steps
        const fixedSubs = nextStep.id === "fixed-appliances" && state.selectedScenario ? getFixedMotorSubSteps(state.selectedScenario) : [];
        const firstFixedSub = fixedSubs.length > 0 ? fixedSubs[0] : null;

        let nextSparky: string;
        if (hvacSub) nextSparky = hvacSub.sparkyPrompt;
        else if (firstFixedSub) nextSparky = firstFixedSub.sparkyPrompt;
        else nextSparky = resolveSparkyPrompt(nextStep, state.selectedScenario!, necVersion);

        const newState: CalculatorState<HouseScenario> = {
          ...state,
          currentStepIndex: state.currentStepIndex + 1,
          answers: newAnswers,
          userInput: "",
          showHint: false,
          lastAnswerCorrect: true,
          sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.correct)}${storedNote} ${nextSparky}`,
          ...(nextStep.id === "hvac" ? { hvacSubStepIndex: 0, hvacMotorVA: undefined } : {}),
          ...(nextStep.id === "fixed-appliances" ? { fixedMotorSubStepIndex: 0, fixedMotorVAs: undefined } : {}),
        };
        setState(newState);
      }
    } else {
      setState(prev => ({
        ...prev,
        lastAnswerCorrect: false,
        sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.incorrect)} The correct answer is ${expectedAnswer.toLocaleString()}. Check the hint for details!`,
        showHint: true,
      }));
    }
  }, [state, activeSteps]);

  // Handle trying again after incorrect answer
  const handleTryAgain = useCallback(() => {
    setState(prev => {
      const currentStepId = activeSteps[prev.currentStepIndex]?.id;
      let sparkyMessage: string;

      if (currentStepId === "hvac" && (prev.hvacSubStepIndex ?? 0) === 0 && prev.selectedScenario) {
        const hvacSub = getHvacMotorSubStep(prev.selectedScenario);
        sparkyMessage = hvacSub?.sparkyPrompt || resolveSparkyPrompt(activeSteps[prev.currentStepIndex], prev.selectedScenario!, necVersion);
      } else if (currentStepId === "fixed-appliances" && prev.selectedScenario) {
        const fixedSubs = getFixedMotorSubSteps(prev.selectedScenario);
        const fixedIdx = prev.fixedMotorSubStepIndex ?? 0;
        if (fixedIdx < fixedSubs.length) {
          sparkyMessage = fixedSubs[fixedIdx].sparkyPrompt;
        } else {
          sparkyMessage = resolveSparkyPrompt(activeSteps[prev.currentStepIndex], prev.selectedScenario!, necVersion);
        }
      } else {
        sparkyMessage = resolveSparkyPrompt(activeSteps[prev.currentStepIndex], prev.selectedScenario!, necVersion);
      }

      return {
        ...prev,
        userInput: "",
        lastAnswerCorrect: null,
        sparkyMessage,
      };
    });
  }, [activeSteps, necVersion]);

  // Handle going to previous step
  const handlePreviousStep = useCallback(() => {
    const currentStepId = activeSteps[state.currentStepIndex]?.id;
    const hvacSubIdx = state.hvacSubStepIndex ?? 0;

    // If on HVAC sub-step 1 (comparison), go back to sub-step 0 (motor conversion)
    if (currentStepId === "hvac" && hvacSubIdx === 1 && state.selectedScenario) {
      const hvacSub = getHvacMotorSubStep(state.selectedScenario);
      setState(prev => ({
        ...prev,
        hvacSubStepIndex: 0,
        userInput: prev.hvacMotorVA ? prev.hvacMotorVA.toLocaleString() : "",
        showHint: false,
        lastAnswerCorrect: null,
        sparkyMessage: hvacSub?.sparkyPrompt || resolveSparkyPrompt(activeSteps[state.currentStepIndex], state.selectedScenario!, necVersion),
      }));
      return;
    }

    // If on a fixed-motor sub-step, go back one sub-step (or to previous main step)
    if (currentStepId === "fixed-appliances" && state.selectedScenario) {
      const fixedSubs = getFixedMotorSubSteps(state.selectedScenario);
      const fixedIdx = state.fixedMotorSubStepIndex ?? 0;
      if (fixedIdx > 0 && fixedIdx <= fixedSubs.length) {
        // Go back to previous motor sub-step
        const prevSub = fixedSubs[fixedIdx - 1];
        const newVAs = { ...(state.fixedMotorVAs || {}) };
        delete newVAs[prevSub.motorName];
        setState(prev => ({
          ...prev,
          fixedMotorSubStepIndex: fixedIdx - 1,
          fixedMotorVAs: newVAs,
          userInput: "",
          showHint: false,
          lastAnswerCorrect: null,
          sparkyMessage: prevSub.sparkyPrompt,
        }));
        return;
      }
      // fixedIdx === 0 means we're on the first motor sub-step, fall through to normal previous
    }

    // If navigating back FROM the step after HVAC, land on HVAC sub-step 1
    if (state.currentStepIndex > 0) {
      const prevStep = activeSteps[state.currentStepIndex - 1];

      // If going back to fixed-appliances step, land on the normal (post-motor) sub-step
      if (prevStep.id === "fixed-appliances") {
        const fixedSubs = state.selectedScenario ? getFixedMotorSubSteps(state.selectedScenario) : [];
        const newAnswers = { ...state.answers };
        delete newAnswers["fixed-appliances"];
        setState(prev => ({
          ...prev,
          currentStepIndex: state.currentStepIndex - 1,
          answers: newAnswers,
          fixedMotorSubStepIndex: fixedSubs.length,
          userInput: "",
          showHint: false,
          lastAnswerCorrect: null,
          sparkyMessage: resolveSparkyPrompt(prevStep, state.selectedScenario!, necVersion),
        }));
        return;
      }

      if (prevStep.id === "hvac") {
        const newAnswers = { ...state.answers };
        delete newAnswers["hvac"];
        setState(prev => ({
          ...prev,
          currentStepIndex: state.currentStepIndex - 1,
          answers: newAnswers,
          hvacSubStepIndex: 1,
          userInput: "",
          showHint: false,
          lastAnswerCorrect: null,
          sparkyMessage: resolveSparkyPrompt(prevStep, state.selectedScenario!, necVersion),
        }));
        return;
      }

      // Normal previous behavior
      const newState: CalculatorState<HouseScenario> = {
        ...state,
        currentStepIndex: state.currentStepIndex - 1,
        userInput: state.answers[prevStep.id] ? state.answers[prevStep.id].toLocaleString() : "",
        showHint: false,
        lastAnswerCorrect: null,
        sparkyMessage: resolveSparkyPrompt(prevStep, state.selectedScenario!, necVersion),
      };
      setState(newState);
    }
  }, [state, activeSteps]);

  // Reset calculator — navigate back to landing page
  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    router.push("/load-calculator");
  }, [router]);

  // Compute completion results for display
  const getCompletionResults = useCallback(() => {
    if (!state.isComplete || !state.selectedScenario) return null;
    const serviceAmps = state.answers["service-amps"] || 0;
    const copperSize = getDwellingConductorSize(serviceAmps);
    const aluminumSize = getDwellingAluminumSize(serviceAmps);
    const gec = getGECSize(copperSize);
    return {
      serviceAmps,
      conductorSize: copperSize,
      aluminumConductorSize: aluminumSize,
      gecSize: gec,
    };
  }, [state.isComplete, state.selectedScenario, state.answers]);

  const completionResults = getCompletionResults();

  const currentStep = state.selectedScenario ? activeSteps[state.currentStepIndex] : null;

  return (
    <CalculatorPageLayout
      isLoading={status === "loading"}
      subtitle="Based on the Standard Method — 2023 NEC Article 220 Part III"
      hasScenario={!!state.selectedScenario}
      currentStepIndex={state.currentStepIndex}
      totalSteps={activeSteps.length}
      isComplete={state.isComplete}
      onReset={handleReset}
    >
      {/* LEFT COLUMN: Equipment + Quick Reference */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="lg:col-span-3 space-y-4 order-2 lg:order-1"
      >
        {/* Equipment List */}
        {state.selectedScenario && (
          <CollapsibleCard
            title={`${state.selectedScenario.name} Equipment`}
            icon={<Home className="h-4 w-4" />}
            iconColor="text-amber"
            defaultExpanded={true}
          >
            <div className="space-y-1 text-sm">
              {(() => {
                const accountedIds = getAccountedApplianceIds(state.currentStepIndex - 1, activeSteps);
                const currentStepId = activeSteps[state.currentStepIndex]?.id;
                const currentStepAppliances = currentStepId ? STEP_APPLIANCE_MAP[currentStepId] || [] : [];

                // Temporarily unscratch non-A/C motors during largest-motor-25 so student can see all values
                // A/C stays scratched off — it was already covered in the HVAC step
                if (currentStepId === "largest-motor-25") {
                  state.selectedScenario!.appliances.forEach(a => {
                    if (a.isMotor && a.id !== "ac") accountedIds.delete(a.id);
                  });
                }

                // Build grouped items: square footage goes in "building", appliances go by category
                type DisplayItem = {
                  id: string;
                  name: string;
                  value: string;
                  category: string;
                  isMotor?: boolean;
                  horsepower?: number;
                  convertedVA?: number | null;
                };

                const items: DisplayItem[] = [
                  {
                    id: "square-footage",
                    name: "Square Footage",
                    value: `${state.selectedScenario!.squareFootage.toLocaleString()} sq ft`,
                    category: "building",
                  },
                ];

                state.selectedScenario!.appliances.forEach(appliance => {
                  const isMotor = appliance.isMotor && appliance.horsepower;
                  let convertedVA: number | null = null;
                  if (isMotor && appliance.id === "ac" && state.hvacMotorVA) {
                    convertedVA = state.hvacMotorVA;
                  } else if (isMotor && state.fixedMotorVAs?.[appliance.name]) {
                    convertedVA = state.fixedMotorVAs[appliance.name];
                  }
                  items.push({
                    id: appliance.id,
                    name: appliance.name,
                    value: isMotor ? `${appliance.horsepower} HP` : `${appliance.watts.toLocaleString()}W`,
                    category: APPLIANCE_CATEGORY[appliance.id] || "fixed",
                    isMotor: !!isMotor,
                    horsepower: appliance.horsepower,
                    convertedVA,
                  });
                });

                // Group by category
                const grouped: Record<string, DisplayItem[]> = {};
                items.forEach(item => {
                  if (!grouped[item.category]) grouped[item.category] = [];
                  grouped[item.category].push(item);
                });

                return CATEGORY_ORDER.map(cat => {
                  const catItems = grouped[cat];
                  if (!catItems || catItems.length === 0) return null;

                  return (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-1">
                        {CATEGORY_LABELS[cat]}
                      </p>
                      {catItems.map(item => {
                        const isAccountedFor = accountedIds.has(item.id);
                        const isMotorHighlightStep = currentStepId === "largest-motor-25" && item.isMotor;
                        const isHighlighted = !isAccountedFor && (currentStepAppliances.includes(item.id) || isMotorHighlightStep);

                        return (
                          <div
                            key={item.id}
                            className={`flex justify-between items-start transition-all duration-300 rounded-md px-2 py-0.5 -mx-2 ${
                              isHighlighted
                                ? "bg-amber/20 border border-amber/40"
                                : isAccountedFor
                                ? "text-muted-foreground/50"
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className={`mr-2 min-w-0 flex items-start gap-1.5 ${
                              isAccountedFor ? "line-through" : ""
                            } ${isHighlighted ? "text-amber dark:text-sparky-green font-medium" : ""}`}>
                              {isAccountedFor && (
                                <CheckCircle2 className="h-3 w-3 text-emerald flex-shrink-0 mt-0.5" />
                              )}
                              {isHighlighted && (
                                <Plus className="h-3 w-3 text-amber flex-shrink-0 mt-0.5" />
                              )}
                              {item.name}
                            </span>
                            <span className={`font-mono whitespace-nowrap text-xs flex-shrink-0 text-right ${
                              isHighlighted
                                ? "text-amber dark:text-sparky-green font-semibold"
                                : isAccountedFor
                                ? "text-muted-foreground/50 line-through"
                                : "text-foreground"
                            }`}>
                              {item.value}
                              {item.convertedVA != null && (
                                <div className="text-emerald dark:text-sparky-green">
                                  = {item.convertedVA.toLocaleString()} VA
                                </div>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          </CollapsibleCard>
        )}

        {/* Quick Reference — below Equipment in left column */}
        {state.selectedScenario && (
          <CollapsibleCard
            title="Quick Reference"
            icon={<BookOpen className="h-4 w-4" />}
            iconColor="text-purple"
            defaultExpanded={false}
          >
            <div className="space-y-3 text-sm">
              {getQuickReferenceItems(necVersion).map((item) => {
                const isCovered = state.selectedScenario && isQuickRefCovered(item.id, state.currentStepIndex, activeSteps);

                return (
                  <div
                    key={item.id}
                    className={`transition-all duration-300 ${
                      isCovered ? "opacity-50" : ""
                    }`}
                  >
                    <p className={`font-medium flex items-center gap-2 ${
                      isCovered ? "text-muted-foreground line-through" : "text-foreground"
                    }`}>
                      {isCovered && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald flex-shrink-0" />
                      )}
                      {item.label}
                    </p>
                    <p className={`${
                      isCovered ? "text-muted-foreground/50 line-through" : "text-muted-foreground"
                    }`}>
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </CollapsibleCard>
        )}
      </motion.div>

      {/* MIDDLE COLUMN: Questions / Sparky Q&A */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="lg:col-span-6 order-1 lg:order-2"
      >
        <CollapsibleCard
          title={state.isComplete
            ? "Calculation Complete!"
            : state.selectedScenario
              ? currentStep?.id === "hvac" && (state.hvacSubStepIndex ?? 0) === 0
                ? "HVAC: Convert A/C Motor"
                : currentStep?.id === "fixed-appliances" && (() => {
                    const subs = getFixedMotorSubSteps(state.selectedScenario!);
                    const idx = state.fixedMotorSubStepIndex ?? 0;
                    return idx < subs.length ? `Fixed Appliances: Convert ${subs[idx].motorName}` : null;
                  })()
                  ? (() => {
                      const subs = getFixedMotorSubSteps(state.selectedScenario!);
                      const idx = state.fixedMotorSubStepIndex ?? 0;
                      return `Fixed Appliances: Convert ${subs[idx].motorName}`;
                    })()
                  : currentStep ? resolveTitle(currentStep, necVersion) : "Select a Scenario"
              : "Select a Scenario"}
          icon={<Calculator className="h-5 w-5" />}
          iconColor="text-amber"
          defaultExpanded={true}
        >
            {/* Sparky Message */}
            <div className="mb-6">
              <SparkyMessage
                size="medium"
                message={state.sparkyMessage}
              />
            </div>

            {/* Active Calculation Step */}
            {state.selectedScenario && !state.isComplete && currentStep && (() => {
              const isHvacMotorSubStep = currentStep.id === "hvac" && (state.hvacSubStepIndex ?? 0) === 0;
              const hvacSub = isHvacMotorSubStep ? getHvacMotorSubStep(state.selectedScenario!) : null;

              const fixedSubs = currentStep.id === "fixed-appliances" ? getFixedMotorSubSteps(state.selectedScenario!) : [];
              const fixedIdx = state.fixedMotorSubStepIndex ?? 0;
              const isFixedMotorSubStep = currentStep.id === "fixed-appliances" && fixedIdx < fixedSubs.length;
              const fixedSub = isFixedMotorSubStep ? fixedSubs[fixedIdx] : null;

              const activeSub = hvacSub || fixedSub;
              const stepFormula = activeSub ? activeSub.formula : resolveFormula(currentStep, state.selectedScenario!, necVersion);
              const stepNecRef = activeSub ? activeSub.necReference : resolveNecReference(currentStep, necVersion);
              const stepHint = activeSub ? activeSub.hint : getHintText(currentStep, state.selectedScenario!, state.answers, necVersion);
              const canGoPrev = isHvacMotorSubStep
                ? state.currentStepIndex > 0
                : isFixedMotorSubStep
                  ? fixedIdx > 0 || state.currentStepIndex > 0
                  : currentStep.id === "hvac" ? true : state.currentStepIndex > 0;

              const motionKey = isHvacMotorSubStep
                ? `${currentStep.id}-motor`
                : isFixedMotorSubStep
                  ? `${currentStep.id}-motor-${fixedIdx}`
                  : currentStep.id;

              return (
                <motion.div
                  key={motionKey}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <StepInputArea
                    formula={stepFormula}
                    necReference={stepNecRef}
                    inputLabel="Your Answer (VA or Amps)"
                    inputMode={currentStep.parseInput ? "text" : "numeric"}
                    placeholder={currentStep.parseInput ? "Enter wire size (e.g., 1/0)..." : "Enter your calculation..."}
                    allowSlash={!!currentStep.parseInput}
                    rawInput={!!currentStep.parseInput}
                    userInput={state.userInput}
                    onInputChange={(value) => setState(prev => ({ ...prev, userInput: value }))}
                    showHint={state.showHint}
                    onToggleHint={() => setState(prev => ({ ...prev, showHint: !prev.showHint }))}
                    hintText={stepHint}
                    lastAnswerCorrect={state.lastAnswerCorrect}
                    onSubmit={handleSubmitAnswer}
                    onTryAgain={handleTryAgain}
                    onPrevious={handlePreviousStep}
                    canGoPrevious={canGoPrev}
                    onSaveAndExit={handleSaveAndExit}
                    currentStepIndex={state.currentStepIndex}
                    totalSteps={activeSteps.length}
                  />
                </motion.div>
              );
            })()}

            {/* Completion Screen */}
            {state.isComplete && completionResults && (
              <CompletionScreen
                results={completionResults}
                buildingDescription={`${state.selectedScenario?.squareFootage.toLocaleString()} sq ft home`}
                onReset={handleReset}
              />
            )}
        </CollapsibleCard>
      </motion.div>

      {/* RIGHT COLUMN: Your Calculations + Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="lg:col-span-3 space-y-4 order-4 lg:order-3"
      >
        {/* Running Calculation */}
        {state.selectedScenario && (
          <CollapsibleCard
            title="Your Calculations"
            icon={<Zap className="h-4 w-4" />}
            iconColor="text-emerald"
            defaultExpanded={true}
          >
            {Object.keys(state.answers).length > 0 ? (
              <div className="space-y-2 text-sm">
                {activeSteps.map((step) => {
                  const answer = state.answers[step.id];
                  if (answer === undefined) return null;

                  const currentStepId = activeSteps[state.currentStepIndex]?.id;
                  const isHighlighted = currentStepId === "total-va" && TOTAL_VA_COMPONENT_STEPS.includes(step.id);

                  return (
                    <div
                      key={step.id}
                      className={`flex justify-between items-center rounded-md px-2 py-1 -mx-2 transition-all ${
                        isHighlighted
                          ? "bg-amber/20 border border-amber/40"
                          : ""
                      }`}
                    >
                      <span className={`truncate mr-2 flex items-center gap-1 ${
                        isHighlighted ? "text-amber dark:text-sparky-green font-medium" : "text-muted-foreground"
                      }`}>
                        {isHighlighted && <Plus className="h-3 w-3 flex-shrink-0" />}
                        {resolveTitle(step, necVersion)}
                      </span>
                      <span className={`font-mono whitespace-nowrap ${
                        isHighlighted ? "text-amber dark:text-sparky-green font-semibold" : "text-foreground"
                      }`}>
                        {(() => {
                          if (step.id === "service-conductor") {
                            const sizeLabel = conductorCodeToLabel(answer);
                            return `${sizeLabel} AWG/kcmil`;
                          }
                          if (step.id === "gec-size") {
                            let gecLabel: string;
                            if (answer === 10) gecLabel = "1/0";
                            else if (answer === 20) gecLabel = "2/0";
                            else if (answer === 30) gecLabel = "3/0";
                            else gecLabel = `${answer}`;
                            return `${gecLabel} AWG`;
                          }
                          if (step.id === "service-amps") {
                            return `${answer.toLocaleString()}A`;
                          }
                          return `${answer.toLocaleString()} VA`;
                        })()}
                      </span>
                    </div>
                  );
                })}

                {state.isComplete && completionResults && (
                  <CompletionSummaryCard results={completionResults} />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Your completed calculations will appear here
              </p>
            )}
          </CollapsibleCard>
        )}

        {/* Calculator */}
        {state.selectedScenario && !state.isComplete && (
          <CollapsibleCard
            title="Calculator"
            icon={<Calculator className="h-4 w-4" />}
            iconColor="text-amber"
            defaultExpanded={false}
          >
            <MiniCalculator
              onResult={(value) => setState(prev => ({ ...prev, userInput: formatNumberWithCommas(value) }))}
            />
          </CollapsibleCard>
        )}
      </motion.div>
    </CalculatorPageLayout>
  );
}

export default function LoadCalculatorPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen bg-cream dark:bg-stone-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber" />
        </div>
      </main>
    }>
      <ResidentialCalculatorInner />
    </Suspense>
  );
}
