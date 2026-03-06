"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calculator,
  ChevronLeft,
  Home,
  Zap,
  CheckCircle2,
  BookOpen,
  Plus,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  hpToWatts,
  getHvacMotorSubStep,
  resolveTitle,
  resolveSparkyPrompt,
  resolveNecReference,
  resolveFormula,
  type HouseScenario,
  type DifficultyLevel,
} from "./calculator-data";
import { useNecVersion } from "@/lib/nec-version";
import type { CalculatorState, SavedProgress } from "../_shared/types";
import { fireConfetti, formatNumberWithCommas, parseFormattedNumber, getHintText } from "../_shared/utils";
import { CollapsibleCard } from "../_shared/CollapsibleCard";
import { DifficultySelector } from "../_shared/DifficultySelector";
import { CompletionScreen } from "../_shared/CompletionScreen";
import { CompletionSummaryCard } from "../_shared/CompletionSummaryCard";
import { ResumePromptModal } from "../_shared/ResumePromptModal";
import { StepInputArea } from "../_shared/StepInputArea";
import { CalculatorPageLayout } from "../_shared/CalculatorPageLayout";

const STORAGE_KEY = "sparkypass-load-calculator";

export default function LoadCalculatorPage({ headerExtra }: { headerExtra?: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionIdRef = useRef<string | null>(null);
  const { necVersion } = useNecVersion();

  const [state, setState] = useState<CalculatorState<HouseScenario>>({
    difficulty: null,
    selectedScenario: null,
    currentStepIndex: 0,
    answers: {},
    userInput: "",
    showHint: false,
    lastAnswerCorrect: null,
    sparkyMessage: SPARKY_MESSAGES.welcome,
    isComplete: false,
    manualScratchedOff: new Set(),
    hvacSubStepIndex: 0,
    hvacMotorVA: undefined,
  });

  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  const hasPlayedConfetti = useRef(false);

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

  // Check for saved progress from localStorage
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedProgress;
        // Validate saved data
        if (parsed.scenarioId && parsed.difficulty) {
          const scenario = HOUSE_SCENARIOS.find(s => s.id === parsed.scenarioId);
          if (scenario) {
            // Store saved progress and show the resume prompt
            setSavedProgress(parsed);
            setShowResumePrompt(true);
          }
        }
      } catch {
        // Invalid saved state, ignore
      }
    }
  }, [status, router]);

  // Handle continuing saved progress
  const handleContinueProgress = useCallback(() => {
    if (!savedProgress) return;

    const scenario = HOUSE_SCENARIOS.find(s => s.id === savedProgress.scenarioId);
    if (scenario) {
      const steps = getFilteredSteps(scenario);
      const stepIndex = savedProgress.currentStepIndex || 0;
      const currentStepId = steps[stepIndex]?.id;
      const hvacSubIdx = savedProgress.hvacSubStepIndex || 0;

      // If resuming mid HVAC sub-step, use the sub-step's sparky prompt
      let sparkyMessage: string;
      if (savedProgress.isComplete) {
        sparkyMessage = SPARKY_MESSAGES.complete;
      } else if (currentStepId === "hvac" && hvacSubIdx === 0) {
        const hvacSub = getHvacMotorSubStep(scenario);
        sparkyMessage = hvacSub?.sparkyPrompt || (steps[stepIndex] ? resolveSparkyPrompt(steps[stepIndex], scenario, necVersion) : "");
      } else {
        sparkyMessage = steps[stepIndex] ? resolveSparkyPrompt(steps[stepIndex], scenario, necVersion) : "";
      }

      setState(prev => ({
        ...prev,
        difficulty: savedProgress.difficulty,
        selectedScenario: scenario,
        currentStepIndex: stepIndex,
        answers: savedProgress.answers || {},
        isComplete: savedProgress.isComplete || false,
        sparkyMessage,
        hvacSubStepIndex: hvacSubIdx,
        hvacMotorVA: savedProgress.hvacMotorVA,
      }));
    }
    setShowResumePrompt(false);
    setSavedProgress(null);
  }, [savedProgress]);

  // Handle starting fresh
  const handleStartFresh = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowResumePrompt(false);
    setSavedProgress(null);
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((currentState: CalculatorState<HouseScenario>) => {
    if (currentState.selectedScenario && currentState.difficulty) {
      const toSave: SavedProgress = {
        difficulty: currentState.difficulty,
        scenarioId: currentState.selectedScenario.id,
        currentStepIndex: currentState.currentStepIndex,
        answers: currentState.answers,
        isComplete: currentState.isComplete,
        hvacSubStepIndex: currentState.hvacSubStepIndex,
        hvacMotorVA: currentState.hvacMotorVA,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, []);

  // Handle difficulty selection
  const handleSelectDifficulty = useCallback((difficulty: DifficultyLevel) => {
    setState(prev => ({
      ...prev,
      difficulty,
      sparkyMessage: SPARKY_MESSAGES.selectScenario,
    }));
  }, []);

  const handleSelectScenario = useCallback((scenario: HouseScenario) => {
    const steps = getFilteredSteps(scenario);
    const newState: CalculatorState<HouseScenario> = {
      difficulty: state.difficulty,
      selectedScenario: scenario,
      currentStepIndex: 0,
      answers: {},
      userInput: "",
      showHint: false,
      lastAnswerCorrect: null,
      sparkyMessage: resolveSparkyPrompt(steps[0], scenario, necVersion),
      isComplete: false,
      manualScratchedOff: new Set(),
      hvacSubStepIndex: 0,
      hvacMotorVA: undefined,
    };
    setState(newState);
    saveProgress(newState);

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
  }, [saveProgress, state.difficulty, session?.user]);

  // Toggle manual scratch-off for intermediate mode
  const handleToggleScratchOff = useCallback((applianceId: string) => {
    setState(prev => {
      const newSet = new Set(prev.manualScratchedOff);
      if (newSet.has(applianceId)) {
        newSet.delete(applianceId);
      } else {
        newSet.add(applianceId);
      }
      return { ...prev, manualScratchedOff: newSet };
    });
  }, []);

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
          saveProgress(newState);
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
        saveProgress(completeState);

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
        const newState: CalculatorState<HouseScenario> = {
          ...state,
          currentStepIndex: state.currentStepIndex + 1,
          answers: newAnswers,
          userInput: "",
          showHint: false,
          lastAnswerCorrect: true,
          sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.correct)}${storedNote} ${hvacSub ? hvacSub.sparkyPrompt : resolveSparkyPrompt(nextStep, state.selectedScenario!, necVersion)}`,
          ...(nextStep.id === "hvac" ? { hvacSubStepIndex: 0, hvacMotorVA: undefined } : {}),
        };
        setState(newState);
        saveProgress(newState);
      }
    } else {
      setState(prev => ({
        ...prev,
        lastAnswerCorrect: false,
        sparkyMessage: `${getRandomMessage(SPARKY_MESSAGES.incorrect)} The correct answer is ${expectedAnswer.toLocaleString()}. Check the hint for details!`,
        showHint: true,
      }));
    }
  }, [state, saveProgress, activeSteps]);

  // Handle trying again after incorrect answer
  const handleTryAgain = useCallback(() => {
    setState(prev => {
      const currentStepId = activeSteps[prev.currentStepIndex]?.id;
      let sparkyMessage: string;

      if (currentStepId === "hvac" && (prev.hvacSubStepIndex ?? 0) === 0 && prev.selectedScenario) {
        const hvacSub = getHvacMotorSubStep(prev.selectedScenario);
        sparkyMessage = hvacSub?.sparkyPrompt || resolveSparkyPrompt(activeSteps[prev.currentStepIndex], prev.selectedScenario!, necVersion);
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

    // If navigating back FROM the step after HVAC, land on HVAC sub-step 1
    if (state.currentStepIndex > 0) {
      const prevStep = activeSteps[state.currentStepIndex - 1];
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

  // Reset calculator
  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      difficulty: null,
      selectedScenario: null,
      currentStepIndex: 0,
      answers: {},
      userInput: "",
      showHint: false,
      lastAnswerCorrect: null,
      sparkyMessage: SPARKY_MESSAGES.welcome,
      isComplete: false,
      manualScratchedOff: new Set(),
      hvacSubStepIndex: 0,
      hvacMotorVA: undefined,
    });
  }, []);

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

  // Show resume prompt if there's saved progress
  if (showResumePrompt && savedProgress) {
    const savedScenario = HOUSE_SCENARIOS.find(s => s.id === savedProgress.scenarioId);
    const resumeSteps = savedScenario ? getFilteredSteps(savedScenario) : CALCULATION_STEPS;
    return (
      <ResumePromptModal
        savedProgress={savedProgress}
        scenarioName={savedScenario?.name || "Unknown"}
        scenarioIcon={<Home className="h-4 w-4 text-amber" />}
        totalSteps={resumeSteps.length}
        onContinue={handleContinueProgress}
        onStartFresh={handleStartFresh}
      />
    );
  }

  const currentStep = state.selectedScenario ? activeSteps[state.currentStepIndex] : null;

  return (
    <CalculatorPageLayout
      isLoading={status === "loading"}
      subtitle="Based on the Standard Method — 2023 NEC Article 220 Part III"
      headerExtra={headerExtra}
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
            <div className="space-y-2 text-sm">
              {state.difficulty === "intermediate" && (
                <p className="text-xs text-muted-foreground italic pb-1 border-b mb-2">
                  Click items to mark as accounted for
                </p>
              )}
              {(() => {
                const isBeginner = state.difficulty === "beginner";
                const isIntermediate = state.difficulty === "intermediate";
                const accountedIds = getAccountedApplianceIds(state.currentStepIndex - 1, activeSteps);
                const isAccountedFor = isBeginner && accountedIds.has("square-footage");
                const isManuallyScratchedOff = isIntermediate && state.manualScratchedOff.has("square-footage");
                const currentStepId = activeSteps[state.currentStepIndex]?.id;
                const currentStepAppliances = currentStepId ? STEP_APPLIANCE_MAP[currentStepId] || [] : [];
                const isHighlighted = isBeginner && !isAccountedFor && currentStepAppliances.includes("square-footage");

                return (
                  <div
                    onClick={isIntermediate ? () => handleToggleScratchOff("square-footage") : undefined}
                    className={`flex justify-between items-start transition-all duration-300 rounded-md px-2 py-1 -mx-2 ${
                      isIntermediate ? "cursor-pointer hover:bg-muted/50 pressable" : ""
                    } ${
                      isHighlighted
                        ? "bg-amber/20 border border-amber/40"
                        : isAccountedFor || isManuallyScratchedOff
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className={`mr-2 min-w-0 flex items-start gap-2 ${
                      isAccountedFor || isManuallyScratchedOff ? "line-through" : ""
                    } ${isHighlighted ? "text-amber dark:text-sparky-green font-medium" : ""}`}>
                      {(isAccountedFor || isManuallyScratchedOff) && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald flex-shrink-0 mt-0.5" />
                      )}
                      {isHighlighted && (
                        <Plus className="h-3 w-3 text-amber flex-shrink-0 mt-0.5" />
                      )}
                      Square Footage
                    </span>
                    <span className={`font-mono whitespace-nowrap flex-shrink-0 ${
                      isHighlighted
                        ? "text-amber dark:text-sparky-green font-semibold"
                        : isAccountedFor || isManuallyScratchedOff
                        ? "text-muted-foreground/50 line-through"
                        : "text-foreground"
                    }`}>
                      {state.selectedScenario!.squareFootage.toLocaleString()} sq ft
                    </span>
                  </div>
                );
              })()}
              {(() => {
                return state.selectedScenario!.appliances.map((appliance) => {
                const isBeginner = state.difficulty === "beginner";
                const isIntermediate = state.difficulty === "intermediate";
                const accountedIds = getAccountedApplianceIds(state.currentStepIndex - 1, activeSteps);
                const isAccountedFor = isBeginner && accountedIds.has(appliance.id);
                const isManuallyScratchedOff = isIntermediate && state.manualScratchedOff.has(appliance.id);
                const currentStepId = activeSteps[state.currentStepIndex]?.id;
                const isMotor = appliance.isMotor && appliance.horsepower;

                // Show converted VA for A/C motor once student has answered the conversion
                const convertedVA = isMotor && appliance.id === "ac" && state.hvacMotorVA
                  ? state.hvacMotorVA
                  : null;

                // Highlight appliances relevant to the current step (beginner only)
                const currentStepAppliances = currentStepId ? STEP_APPLIANCE_MAP[currentStepId] || [] : [];
                // During largest-motor-25, highlight all motor appliances
                const isMotorHighlightStep = currentStepId === "largest-motor-25" && isMotor;
                const isHighlighted = isBeginner && !isAccountedFor && (currentStepAppliances.includes(appliance.id) || isMotorHighlightStep);

                return (
                  <div
                    key={appliance.id}
                    onClick={isIntermediate ? () => handleToggleScratchOff(appliance.id) : undefined}
                    className={`flex justify-between items-start transition-all duration-300 rounded-md px-2 py-1 -mx-2 ${
                      isIntermediate ? "cursor-pointer hover:bg-muted/50 pressable" : ""
                    } ${
                      isHighlighted
                        ? "bg-amber/20 border border-amber/40"
                        : isAccountedFor || isManuallyScratchedOff
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className={`mr-2 min-w-0 flex items-start gap-2 ${
                      isAccountedFor || isManuallyScratchedOff ? "line-through" : ""
                    } ${isHighlighted ? "text-amber dark:text-sparky-green font-medium" : ""}`}>
                      {(isAccountedFor || isManuallyScratchedOff) && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald flex-shrink-0 mt-0.5" />
                      )}
                      {isHighlighted && (
                        <Plus className="h-3 w-3 text-amber flex-shrink-0 mt-0.5" />
                      )}
                      {appliance.name}
                    </span>
                    <span className={`font-mono whitespace-nowrap flex-shrink-0 text-right ${
                      isHighlighted
                        ? "text-amber dark:text-sparky-green font-semibold"
                        : isAccountedFor || isManuallyScratchedOff
                        ? "text-muted-foreground/50 line-through"
                        : "text-foreground"
                    }`}>
                      {isMotor ? (
                        <>
                          <span>{appliance.horsepower} HP</span>
                          {convertedVA !== null && (
                            <div className="text-emerald dark:text-sparky-green text-xs">
                              = {convertedVA.toLocaleString()} VA
                            </div>
                          )}
                        </>
                      ) : (
                        <span>{appliance.watts.toLocaleString()}W</span>
                      )}
                    </span>
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
                const isBeginner = state.difficulty === "beginner";
                const isCovered = isBeginner && state.selectedScenario && isQuickRefCovered(item.id, state.currentStepIndex, activeSteps);

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

            {/* Difficulty Selection */}
            {!state.difficulty && !state.selectedScenario && (
              <DifficultySelector onSelect={handleSelectDifficulty} />
            )}

            {/* Scenario Selection */}
            {state.difficulty && !state.selectedScenario && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setState(prev => ({ ...prev, difficulty: null }))}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Change Difficulty
                  </button>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    state.difficulty === "beginner"
                      ? "bg-emerald/10 text-emerald dark:bg-sparky-green/10 dark:text-sparky-green"
                      : "bg-amber/10 text-amber"
                  }`}>
                    {state.difficulty === "beginner" ? "Beginner" : "Intermediate"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {HOUSE_SCENARIOS.map((scenario) => (
                    <Card
                      key={scenario.id}
                      className="cursor-pointer hover:border-amber/50 hover:shadow-md transition-all duration-300 pressable border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]"
                      onClick={() => handleSelectScenario(scenario)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
                            <Home className="h-5 w-5 text-amber" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{scenario.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {scenario.squareFootage.toLocaleString()} sq ft
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {scenario.description}
                        </p>
                        <p className="text-xs text-amber mt-2">
                          {scenario.appliances.length} appliances
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Active Calculation Step */}
            {state.selectedScenario && !state.isComplete && currentStep && (() => {
              const isHvacMotorSubStep = currentStep.id === "hvac" && (state.hvacSubStepIndex ?? 0) === 0;
              const hvacSub = isHvacMotorSubStep ? getHvacMotorSubStep(state.selectedScenario!) : null;

              const stepFormula = hvacSub ? hvacSub.formula : resolveFormula(currentStep, state.selectedScenario!, necVersion);
              const stepNecRef = hvacSub ? hvacSub.necReference : resolveNecReference(currentStep, necVersion);
              const stepHint = hvacSub ? hvacSub.hint : getHintText(currentStep, state.selectedScenario!, state.answers, necVersion);
              const canGoPrev = isHvacMotorSubStep ? state.currentStepIndex > 0 : (currentStep.id === "hvac" ? true : state.currentStepIndex > 0);

              return (
                <motion.div
                  key={isHvacMotorSubStep ? `${currentStep.id}-motor` : currentStep.id}
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

                  const isBeginner = state.difficulty === "beginner";
                  const currentStepId = activeSteps[state.currentStepIndex]?.id;
                  const isHighlighted = isBeginner && currentStepId === "total-va" && TOTAL_VA_COMPONENT_STEPS.includes(step.id);

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

        {/* Save Indicator */}
        {state.selectedScenario && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Save className="h-4 w-4" />
            Progress saved automatically
          </div>
        )}
      </motion.div>
    </CalculatorPageLayout>
  );
}
