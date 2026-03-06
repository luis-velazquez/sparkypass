"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calculator,
  ChevronLeft,
  Zap,
  CheckCircle2,
  BookOpen,
  Plus,
  Save,
  Store,
  UtensilsCrossed,
  Building2,
  Warehouse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkyMessage } from "@/components/sparky";
import { MiniCalculator } from "../_shared/MiniCalculator";
import {
  COMMERCIAL_SCENARIOS,
  ALL_COMMERCIAL_SCENARIOS,
  BUILDING_TYPES,
  COMMERCIAL_CALCULATION_STEPS,
  COMMERCIAL_SPARKY_MESSAGES,
  COMMERCIAL_TOTAL_VA_STEPS,
  COMMERCIAL_STEP_EQUIPMENT_MAP,
  getRandomMessage,
  getEquipmentDisplayItems,
  getAccountedEquipmentIds,
  getKitchenEquipmentIds,
  getMotorIds,
  getCommercialQuickReference,
  isCommercialQuickRefCovered,
  getConductorSize,
  getAluminumConductorSize,
  getGECSize,
  getServiceAmps,
  motorToVA,
  getMotorSubSteps,
  getHvacMotorSubStep,
  getHvacRef,
  resolveSparkyPrompt,
  resolveFormula,
  resolveTitle,
  resolveNecReference,
  type CommercialScenario,
  type BuildingType,
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

// Map scenario IDs to icons
const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  retail: <Store className="h-5 w-5 text-amber" />,
  restaurant: <UtensilsCrossed className="h-5 w-5 text-amber" />,
  office: <Building2 className="h-5 w-5 text-amber" />,
  warehouse: <Warehouse className="h-5 w-5 text-amber" />,
};

// Category labels and order
const CATEGORY_LABELS: Record<string, string> = {
  building: "Building Info",
  outlets: "Outlet Loads",
  kitchen: "Kitchen Equipment",
  hvac: "HVAC",
  motors: "Other Motors",
};

const CATEGORY_ORDER = ["building", "outlets", "kitchen", "hvac", "motors"];

const STORAGE_KEY = "sparkypass-commercial-load-calculator";

export default function CommercialLoadCalculatorPage({ headerExtra }: { headerExtra?: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionIdRef = useRef<string | null>(null);
  const { necVersion } = useNecVersion();

  const [state, setState] = useState<CalculatorState<CommercialScenario>>({
    difficulty: null,
    selectedScenario: null,
    currentStepIndex: 0,
    answers: {},
    userInput: "",
    showHint: false,
    lastAnswerCorrect: null,
    sparkyMessage: COMMERCIAL_SPARKY_MESSAGES.welcome,
    isComplete: false,
    manualScratchedOff: new Set(),
    motorSubStepIndex: 0,
    motorSubStepAnswers: {},
    hvacSubStepIndex: 0,
    hvacMotorVA: undefined,
  });

  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  const hasPlayedConfetti = useRef(false);

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
        if (parsed.scenarioId && parsed.difficulty) {
          // Legacy ID migration: old saves used "retail"/"restaurant"/"office"/"warehouse"
          const LEGACY_ID_MAP: Record<string, string> = {
            retail: "retail-1",
            restaurant: "restaurant-1",
            office: "office-1",
            warehouse: "warehouse-1",
          };
          if (LEGACY_ID_MAP[parsed.scenarioId]) {
            parsed.scenarioId = LEGACY_ID_MAP[parsed.scenarioId];
          }
          const scenario = ALL_COMMERCIAL_SCENARIOS.find(s => s.id === parsed.scenarioId);
          if (scenario) {
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

    const scenario = ALL_COMMERCIAL_SCENARIOS.find(s => s.id === savedProgress.scenarioId);
    if (scenario) {
      const stepIndex = savedProgress.currentStepIndex || 0;
      const currentStepId = COMMERCIAL_CALCULATION_STEPS[stepIndex]?.id;
      const subStepIndex = savedProgress.motorSubStepIndex || 0;

      const hvacSubIdx = savedProgress.hvacSubStepIndex || 0;

      // If resuming mid sub-step, use the sub-step's sparky prompt
      let sparkyMessage: string;
      if (savedProgress.isComplete) {
        sparkyMessage = COMMERCIAL_SPARKY_MESSAGES.complete;
      } else if (currentStepId === "hvac" && hvacSubIdx === 0) {
        const hvacSub = getHvacMotorSubStep(scenario, necVersion);
        sparkyMessage = hvacSub?.sparkyPrompt || resolveSparkyPrompt(COMMERCIAL_CALCULATION_STEPS[stepIndex], scenario, necVersion);
      } else if (currentStepId === "convert-motors" && savedProgress.motorSubStepAnswers) {
        const subSteps = getMotorSubSteps(scenario);
        sparkyMessage = subSteps[subStepIndex]?.sparkyPrompt || resolveSparkyPrompt(COMMERCIAL_CALCULATION_STEPS[stepIndex], scenario, necVersion);
      } else {
        sparkyMessage = resolveSparkyPrompt(COMMERCIAL_CALCULATION_STEPS[stepIndex], scenario, necVersion);
      }

      setState(prev => ({
        ...prev,
        difficulty: savedProgress.difficulty,
        selectedScenario: scenario,
        currentStepIndex: stepIndex,
        answers: savedProgress.answers || {},
        isComplete: savedProgress.isComplete || false,
        sparkyMessage,
        motorSubStepIndex: subStepIndex,
        motorSubStepAnswers: savedProgress.motorSubStepAnswers || {},
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
  const saveProgress = useCallback((currentState: CalculatorState<CommercialScenario>) => {
    if (currentState.selectedScenario && currentState.difficulty) {
      const toSave: SavedProgress = {
        difficulty: currentState.difficulty,
        scenarioId: currentState.selectedScenario.id,
        currentStepIndex: currentState.currentStepIndex,
        answers: currentState.answers,
        isComplete: currentState.isComplete,
        motorSubStepIndex: currentState.motorSubStepIndex,
        motorSubStepAnswers: currentState.motorSubStepAnswers,
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
      sparkyMessage: COMMERCIAL_SPARKY_MESSAGES.selectScenario,
    }));
  }, []);

  // Handle scenario selection — pick a random variant from the building type
  const handleSelectScenario = useCallback((bt: BuildingType) => {
    const scenario = bt.variants[Math.floor(Math.random() * bt.variants.length)];
    const newState: CalculatorState<CommercialScenario> = {
      difficulty: state.difficulty,
      selectedScenario: scenario,
      currentStepIndex: 0,
      answers: {},
      userInput: "",
      showHint: false,
      lastAnswerCorrect: null,
      sparkyMessage: resolveSparkyPrompt(COMMERCIAL_CALCULATION_STEPS[0], scenario, necVersion),
      isComplete: false,
      manualScratchedOff: new Set(),
      motorSubStepIndex: 0,
      motorSubStepAnswers: {},
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
        body: JSON.stringify({ sessionType: "load_calculator", categorySlug: "commercial" }),
      })
        .then(res => res.json())
        .then(data => { sessionIdRef.current = data.sessionId; })
        .catch(() => {});
    }
  }, [saveProgress, state.difficulty, session?.user]);

  // Toggle manual scratch-off for intermediate mode
  const handleToggleScratchOff = useCallback((equipmentId: string) => {
    setState(prev => {
      const newSet = new Set(prev.manualScratchedOff);
      if (newSet.has(equipmentId)) {
        newSet.delete(equipmentId);
      } else {
        newSet.add(equipmentId);
      }
      return { ...prev, manualScratchedOff: newSet };
    });
  }, []);

  // Handle answer submission
  const handleSubmitAnswer = useCallback(() => {
    if (!state.selectedScenario || state.isComplete) return;

    const currentStep = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex];
    const userAnswer = parseFormattedNumber(state.userInput);

    if (isNaN(userAnswer)) {
      setState(prev => ({
        ...prev,
        sparkyMessage: "Please enter a valid number!",
      }));
      return;
    }

    // ─── HVAC sub-step branch (220.60 motor conversion) ────────────────────
    if (currentStep.id === "hvac" && (state.hvacSubStepIndex ?? 0) === 0) {
      const hvacSub = getHvacMotorSubStep(state.selectedScenario, necVersion);
      if (hvacSub) {
        const isCorrect = Math.abs(userAnswer - hvacSub.expectedVA) <= 50;
        if (isCorrect) {
          const heatWatts = state.selectedScenario.heatWatts;
          const newState: CalculatorState<CommercialScenario> = {
            ...state,
            userInput: "",
            showHint: false,
            lastAnswerCorrect: true,
            hvacSubStepIndex: 1,
            hvacMotorVA: userAnswer,
            sparkyMessage: heatWatts > 0
              ? `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.correct)} The A/C is ${userAnswer.toLocaleString()} VA. Now compare with the ${heatWatts.toLocaleString()} W heating load per ${getHvacRef(necVersion)} and enter the larger value.`
              : `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.correct)} The A/C is ${userAnswer.toLocaleString()} VA. There's no electric heat, so the HVAC load is the A/C value.`,
          };
          setState(newState);
          saveProgress(newState);
        } else {
          setState(prev => ({
            ...prev,
            lastAnswerCorrect: false,
            sparkyMessage: `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.incorrect)} The correct answer is ${hvacSub.expectedVA.toLocaleString()}. Check the hint for details!`,
            showHint: false,
          }));
        }
        return;
      }
    }

    // ─── Motor sub-step branch ───────────────────────────────────────────
    if (currentStep.id === "convert-motors") {
      const subSteps = getMotorSubSteps(state.selectedScenario);
      const subStepIdx = state.motorSubStepIndex ?? 0;
      const currentSubStep = subSteps[subStepIdx];

      if (!currentSubStep) return;

      const isCorrect = Math.abs(userAnswer - currentSubStep.expectedVA) <= 50;

      if (isCorrect) {
        const newSubAnswers = { ...state.motorSubStepAnswers, [currentSubStep.equipmentId]: userAnswer };
        const isLastSubStep = subStepIdx === subSteps.length - 1;

        if (isLastSubStep) {
          // All motors converted — compute largest VA (include A/C motor from HVAC step)
          const allMotorVAs = Object.values(newSubAnswers);
          if (state.hvacMotorVA) allMotorVAs.push(state.hvacMotorVA);
          const largestVA = Math.max(...allMotorVAs);
          const newAnswers = { ...state.answers, [currentStep.id]: largestVA };
          const nextStep = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex + 1];
          const newState: CalculatorState<CommercialScenario> = {
            ...state,
            currentStepIndex: state.currentStepIndex + 1,
            answers: newAnswers,
            userInput: "",
            showHint: false,
            lastAnswerCorrect: true,
            sparkyMessage: `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.correct)} ${resolveSparkyPrompt(nextStep, state.selectedScenario, necVersion)}`,
            motorSubStepIndex: subStepIdx,
            motorSubStepAnswers: newSubAnswers,
          };
          setState(newState);
          saveProgress(newState);
        } else {
          // Advance to next motor sub-step
          const nextSubStep = subSteps[subStepIdx + 1];
          const newState: CalculatorState<CommercialScenario> = {
            ...state,
            userInput: "",
            showHint: false,
            lastAnswerCorrect: true,
            sparkyMessage: `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.correct)} ${nextSubStep.sparkyPrompt}`,
            motorSubStepIndex: subStepIdx + 1,
            motorSubStepAnswers: newSubAnswers,
          };
          setState(newState);
          saveProgress(newState);
        }
      } else {
        setState(prev => ({
          ...prev,
          lastAnswerCorrect: false,
          sparkyMessage: `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.incorrect)} The correct answer is ${currentSubStep.expectedVA.toLocaleString()}. Check the hint for details!`,
          showHint: true,
        }));
      }
      return;
    }

    // ─── Normal step handling ────────────────────────────────────────────
    const expectedAnswer = currentStep.expectedAnswer?.(state.selectedScenario, state.answers) ?? 0;
    const isCorrect = currentStep.validateAnswer?.(userAnswer, expectedAnswer) ?? false;

    const newAnswers = { ...state.answers, [currentStep.id]: userAnswer };
    const isLastStep = state.currentStepIndex === COMMERCIAL_CALCULATION_STEPS.length - 1;

    if (isCorrect) {
      if (isLastStep) {
        const completeState: CalculatorState<CommercialScenario> = {
          ...state,
          answers: newAnswers,
          lastAnswerCorrect: true,
          sparkyMessage: COMMERCIAL_SPARKY_MESSAGES.complete,
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
              questionsAnswered: COMMERCIAL_CALCULATION_STEPS.length,
              questionsCorrect: COMMERCIAL_CALCULATION_STEPS.length,
            }),
          }).catch(() => {});
          sessionIdRef.current = null;
        }
      } else {
        const nextStep = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex + 1];

        // Auto-skip convert-motors if all motors were already converted (e.g., only A/C motor)
        if (nextStep.id === "convert-motors" && state.selectedScenario) {
          const motorSubSteps = getMotorSubSteps(state.selectedScenario);
          if (motorSubSteps.length === 0 && state.hvacMotorVA) {
            // Only motor is the A/C, already converted — record largest VA and skip to next step
            const skipAnswers = { ...newAnswers, "convert-motors": state.hvacMotorVA };
            const stepAfter = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex + 2];
            const newState: CalculatorState<CommercialScenario> = {
              ...state,
              currentStepIndex: state.currentStepIndex + 2,
              answers: skipAnswers,
              userInput: "",
              showHint: false,
              lastAnswerCorrect: true,
              sparkyMessage: `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.correct)} The only motor is the A/C (${state.hvacMotorVA.toLocaleString()} VA), already converted. ${resolveSparkyPrompt(stepAfter, state.selectedScenario!, necVersion)}`,
              motorSubStepIndex: 0,
              motorSubStepAnswers: {},
            };
            setState(newState);
            saveProgress(newState);
            return;
          }
        }

        const newState: CalculatorState<CommercialScenario> = {
          ...state,
          currentStepIndex: state.currentStepIndex + 1,
          answers: newAnswers,
          userInput: "",
          showHint: false,
          lastAnswerCorrect: true,
          sparkyMessage: `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.correct)} ${
            nextStep.id === "hvac" && state.selectedScenario
              ? (getHvacMotorSubStep(state.selectedScenario, necVersion)?.sparkyPrompt || resolveSparkyPrompt(nextStep, state.selectedScenario, necVersion))
              : nextStep.id === "convert-motors" && state.selectedScenario
              ? (getMotorSubSteps(state.selectedScenario)[0]?.sparkyPrompt || resolveSparkyPrompt(nextStep, state.selectedScenario, necVersion))
              : resolveSparkyPrompt(nextStep, state.selectedScenario!, necVersion)
          }`,
          // Reset sub-step state when advancing to hvac or convert-motors
          ...(nextStep.id === "hvac" ? { hvacSubStepIndex: 0, hvacMotorVA: undefined } : {}),
          ...(nextStep.id === "convert-motors" ? { motorSubStepIndex: 0, motorSubStepAnswers: {} } : {}),
        };
        setState(newState);
        saveProgress(newState);
      }
    } else {
      setState(prev => ({
        ...prev,
        lastAnswerCorrect: false,
        sparkyMessage: `${getRandomMessage(COMMERCIAL_SPARKY_MESSAGES.incorrect)} The correct answer is ${expectedAnswer.toLocaleString()}. Check the hint for details!`,
        showHint: true,
      }));
    }
  }, [state, saveProgress]);

  // Handle trying again after incorrect answer
  const handleTryAgain = useCallback(() => {
    setState(prev => {
      const currentStepId = COMMERCIAL_CALCULATION_STEPS[prev.currentStepIndex]?.id;
      let sparkyMessage: string;

      if (currentStepId === "hvac" && (prev.hvacSubStepIndex ?? 0) === 0 && prev.selectedScenario) {
        const hvacSub = getHvacMotorSubStep(prev.selectedScenario, necVersion);
        sparkyMessage = hvacSub?.sparkyPrompt || resolveSparkyPrompt(COMMERCIAL_CALCULATION_STEPS[prev.currentStepIndex], prev.selectedScenario, necVersion);
      } else if (currentStepId === "convert-motors" && prev.selectedScenario) {
        const subSteps = getMotorSubSteps(prev.selectedScenario);
        sparkyMessage = subSteps[prev.motorSubStepIndex ?? 0]?.sparkyPrompt
          || resolveSparkyPrompt(COMMERCIAL_CALCULATION_STEPS[prev.currentStepIndex], prev.selectedScenario, necVersion);
      } else {
        sparkyMessage = resolveSparkyPrompt(COMMERCIAL_CALCULATION_STEPS[prev.currentStepIndex], prev.selectedScenario!, necVersion);
      }

      return {
        ...prev,
        userInput: "",
        lastAnswerCorrect: null,
        sparkyMessage,
      };
    });
  }, []);

  // Handle going to previous step
  const handlePreviousStep = useCallback(() => {
    const currentStepId = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex]?.id;
    const subStepIdx = state.motorSubStepIndex ?? 0;
    const hvacSubIdx = state.hvacSubStepIndex ?? 0;

    // If on HVAC sub-step 1 (comparison), go back to sub-step 0 (motor conversion)
    if (currentStepId === "hvac" && hvacSubIdx === 1 && state.selectedScenario) {
      const hvacSub = getHvacMotorSubStep(state.selectedScenario, necVersion);
      setState(prev => ({
        ...prev,
        hvacSubStepIndex: 0,
        userInput: prev.hvacMotorVA ? prev.hvacMotorVA.toLocaleString() : "",
        showHint: false,
        lastAnswerCorrect: null,
        sparkyMessage: hvacSub?.sparkyPrompt || resolveSparkyPrompt(COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex], state.selectedScenario!, necVersion),
      }));
      return;
    }

    // If on convert-motors sub-step > 0, go to previous sub-step
    if (currentStepId === "convert-motors" && subStepIdx > 0 && state.selectedScenario) {
      const subSteps = getMotorSubSteps(state.selectedScenario);
      const prevSubStep = subSteps[subStepIdx - 1];
      const prevAnswer = state.motorSubStepAnswers?.[prevSubStep.equipmentId];
      setState(prev => ({
        ...prev,
        motorSubStepIndex: subStepIdx - 1,
        userInput: prevAnswer ? prevAnswer.toLocaleString() : "",
        showHint: false,
        lastAnswerCorrect: null,
        sparkyMessage: prevSubStep.sparkyPrompt,
      }));
      return;
    }

    // If navigating back FROM largest-motor-25, land on last sub-step of convert-motors
    if (currentStepId === "largest-motor-25" && state.selectedScenario) {
      const subSteps = getMotorSubSteps(state.selectedScenario);
      if (subSteps.length > 0) {
        const lastSubIdx = subSteps.length - 1;
        const lastSubStep = subSteps[lastSubIdx];
        const prevAnswer = state.motorSubStepAnswers?.[lastSubStep.equipmentId];
        const newAnswers = { ...state.answers };
        delete newAnswers["convert-motors"];
        setState(prev => ({
          ...prev,
          currentStepIndex: state.currentStepIndex - 1,
          answers: newAnswers,
          motorSubStepIndex: lastSubIdx,
          userInput: prevAnswer ? prevAnswer.toLocaleString() : "",
          showHint: false,
          lastAnswerCorrect: null,
          sparkyMessage: lastSubStep.sparkyPrompt,
        }));
        return;
      }
      // No motor sub-steps (only A/C, already converted) — skip convert-motors, go back 2 steps
      const stepBeforeConvert = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex - 2];
      if (stepBeforeConvert) {
        const newAnswers = { ...state.answers };
        delete newAnswers["convert-motors"];
        delete newAnswers[stepBeforeConvert.id];
        setState(prev => ({
          ...prev,
          currentStepIndex: state.currentStepIndex - 2,
          answers: newAnswers,
          userInput: "",
          showHint: false,
          lastAnswerCorrect: null,
          sparkyMessage: resolveSparkyPrompt(stepBeforeConvert, state.selectedScenario!, necVersion),
        }));
        return;
      }
    }

    // If navigating back to HVAC step, land on sub-step 1 (comparison)
    if (state.currentStepIndex > 0) {
      const prevStep = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex - 1];
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
      const newState: CalculatorState<CommercialScenario> = {
        ...state,
        currentStepIndex: state.currentStepIndex - 1,
        userInput: state.answers[prevStep.id] ? state.answers[prevStep.id].toLocaleString() : "",
        showHint: false,
        lastAnswerCorrect: null,
        sparkyMessage: resolveSparkyPrompt(prevStep, state.selectedScenario!, necVersion),
      };
      setState(newState);
    }
  }, [state]);

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
      sparkyMessage: COMMERCIAL_SPARKY_MESSAGES.welcome,
      isComplete: false,
      manualScratchedOff: new Set(),
      motorSubStepIndex: 0,
      motorSubStepAnswers: {},
      hvacSubStepIndex: 0,
      hvacMotorVA: undefined,
    });
  }, []);

  // Compute completion results
  const getCompletionResults = useCallback(() => {
    if (!state.isComplete || !state.selectedScenario) return null;
    const totalVA = state.answers["total-va"] || 0;
    const amps = getServiceAmps(totalVA, state.selectedScenario.voltage, state.selectedScenario.phases);
    const conductor = getConductorSize(amps);
    const aluminumConductor = getAluminumConductorSize(amps);
    const gec = getGECSize(conductor.size);
    return {
      serviceAmps: state.answers["service-conductor"] || conductor.ampacity,
      conductorSize: conductor.size,
      aluminumConductorSize: aluminumConductor?.size,
      gecSize: gec,
    };
  }, [state.isComplete, state.selectedScenario, state.answers]);

  // Show resume prompt if there's saved progress
  if (showResumePrompt && savedProgress) {
    const savedScenario = ALL_COMMERCIAL_SCENARIOS.find(s => s.id === savedProgress.scenarioId);
    return (
      <ResumePromptModal
        savedProgress={savedProgress}
        scenarioName={savedScenario?.name || "Unknown"}
        scenarioIcon={savedScenario ? (SCENARIO_ICONS[savedScenario.buildingType] || <Building2 className="h-4 w-4 text-amber" />) : <Building2 className="h-4 w-4 text-amber" />}
        totalSteps={COMMERCIAL_CALCULATION_STEPS.length}
        onContinue={handleContinueProgress}
        onStartFresh={handleStartFresh}
      />
    );
  }

  const currentStep = state.selectedScenario ? COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex] : null;
  const completionResults = getCompletionResults();

  // Compute input label based on current step
  const inputLabel = currentStep?.id === "gec-size"
    ? "Your Answer (AWG: use 10 for 1/0, 20 for 2/0, 30 for 3/0)"
    : currentStep?.id === "service-conductor"
    ? "Your Answer (Ampacity from table)"
    : "Your Answer (VA)";

  return (
    <CalculatorPageLayout
      isLoading={status === "loading"}
      subtitle="Learn commercial service load calculations step by step with Sparky!"
      headerExtra={headerExtra}
      hasScenario={!!state.selectedScenario}
      currentStepIndex={state.currentStepIndex}
      totalSteps={COMMERCIAL_CALCULATION_STEPS.length}
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
            icon={SCENARIO_ICONS[state.selectedScenario.buildingType] || <Building2 className="h-4 w-4" />}
            iconColor="text-amber"
            defaultExpanded={true}
          >
            <div className="space-y-1 text-sm">
              {state.difficulty === "intermediate" && (
                <p className="text-xs text-muted-foreground italic pb-1 border-b mb-2">
                  Click items to mark as accounted for
                </p>
              )}
              {(() => {
                const items = getEquipmentDisplayItems(state.selectedScenario!);
                const isBeginner = state.difficulty === "beginner";
                const isIntermediate = state.difficulty === "intermediate";
                const accountedIds = isBeginner
                  ? getAccountedEquipmentIds(state.currentStepIndex - 1, state.selectedScenario!)
                  : new Set<string>();
                const currentStepId = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex]?.id;

                // Temporarily unscratch motors during largest-motor-25 so student can see all values
                if (isBeginner && currentStepId === "largest-motor-25") {
                  accountedIds.delete("ac-motor");
                  getMotorIds(state.selectedScenario!).forEach(id => accountedIds.delete(id));
                }

                // Check if motors have been converted (convert-motors step completed)
                const convertMotorsStepIndex = COMMERCIAL_CALCULATION_STEPS.findIndex(s => s.id === "convert-motors");
                const motorsConverted = convertMotorsStepIndex !== -1 && state.currentStepIndex > convertMotorsStepIndex;
                const isOnConvertMotors = currentStepId === "convert-motors";

                // Build motor VA lookup: map equipment item id → converted VA
                const motorVAMap = new Map<string, number>();
                if (motorsConverted && state.selectedScenario) {
                  const scenario = state.selectedScenario;
                  if (scenario.acMotor) {
                    motorVAMap.set("ac-motor", motorToVA(scenario.acMotor));
                  }
                  scenario.otherMotors.forEach((motor, i) => {
                    motorVAMap.set(`motor-${i}`, motorToVA(motor));
                  });
                } else if (isOnConvertMotors && state.motorSubStepAnswers) {
                  // Show VA for completed sub-steps only
                  for (const [eqId, va] of Object.entries(state.motorSubStepAnswers)) {
                    motorVAMap.set(eqId, va);
                  }
                }
                // After HVAC motor conversion sub-step, show the A/C motor's converted VA
                if (state.hvacMotorVA && !motorVAMap.has("ac-motor")) {
                  motorVAMap.set("ac-motor", state.hvacMotorVA);
                }

                // Get current step equipment for highlighting
                const currentStepEquipment = new Set<string>();
                if (currentStepId && isBeginner) {
                  const staticIds = COMMERCIAL_STEP_EQUIPMENT_MAP[currentStepId] || [];
                  staticIds.forEach(id => currentStepEquipment.add(id));
                  if (currentStepId === "kitchen-demand") {
                    getKitchenEquipmentIds(state.selectedScenario!).forEach(id => currentStepEquipment.add(id));
                  }
                  if (currentStepId === "convert-motors") {
                    // Highlight only the current motor sub-step
                    const subSteps = getMotorSubSteps(state.selectedScenario!);
                    const subIdx = state.motorSubStepIndex ?? 0;
                    if (subSteps[subIdx]) {
                      currentStepEquipment.add(subSteps[subIdx].equipmentId);
                    }
                  }
                  if (currentStepId === "largest-motor-25") {
                    getMotorIds(state.selectedScenario!).forEach(id => currentStepEquipment.add(id));
                    if (state.selectedScenario!.acMotor) currentStepEquipment.add("ac-motor");
                  }
                }

                // Group items by category
                const grouped: Record<string, typeof items> = {};
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
                        const isAccountedFor = isBeginner && accountedIds.has(item.id);
                        const isManuallyScratchedOff = isIntermediate && state.manualScratchedOff.has(item.id);
                        const isHighlighted = isBeginner && !isAccountedFor && currentStepEquipment.has(item.id);

                        return (
                          <div
                            key={item.id}
                            onClick={isIntermediate ? () => handleToggleScratchOff(item.id) : undefined}
                            className={`flex justify-between items-start transition-all duration-300 rounded-md px-2 py-0.5 -mx-2 ${
                              isIntermediate ? "cursor-pointer hover:bg-muted/50 pressable" : ""
                            } ${
                              isHighlighted
                                ? "bg-amber/20 border border-amber/40"
                                : isAccountedFor || isManuallyScratchedOff
                                ? "text-muted-foreground/50"
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className={`mr-2 min-w-0 flex items-start gap-1.5 ${
                              isAccountedFor || isManuallyScratchedOff ? "line-through" : ""
                            } ${isHighlighted ? "text-amber dark:text-sparky-green font-medium" : ""}`}>
                              {(isAccountedFor || isManuallyScratchedOff) && (
                                <CheckCircle2 className="h-3 w-3 text-emerald dark:text-sparky-green flex-shrink-0 mt-0.5" />
                              )}
                              {isHighlighted && (
                                <Plus className="h-3 w-3 text-amber flex-shrink-0 mt-0.5" />
                              )}
                              {item.name}
                            </span>
                            <span className={`font-mono whitespace-nowrap text-xs flex-shrink-0 text-right ${
                              isHighlighted
                                ? "text-amber dark:text-sparky-green font-semibold"
                                : isAccountedFor || isManuallyScratchedOff
                                ? "text-muted-foreground/50 line-through"
                                : "text-foreground"
                            }`}>
                              {item.value}
                              {motorVAMap.has(item.id) && (
                                <div className="text-emerald dark:text-sparky-green">
                                  = {motorVAMap.get(item.id)!.toLocaleString()} VA
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
              {getCommercialQuickReference(necVersion).map((item) => {
                const isBeginner = state.difficulty === "beginner";
                const isCovered = isBeginner && isCommercialQuickRefCovered(item.id, state.currentStepIndex);

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
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald dark:text-sparky-green flex-shrink-0" />
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
                : currentStep?.id === "convert-motors"
                  ? `Convert Motors: ${getMotorSubSteps(state.selectedScenario)[state.motorSubStepIndex ?? 0]?.motorName ?? ""}`
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
                  {BUILDING_TYPES.map((bt) => (
                    <Card
                      key={bt.buildingType}
                      className="cursor-pointer hover:border-amber/50 hover:shadow-md transition-all duration-300 pressable border-border dark:border-stone-800 bg-card dark:bg-stone-900/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]"
                      onClick={() => handleSelectScenario(bt)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
                            {SCENARIO_ICONS[bt.buildingType] || <Building2 className="h-5 w-5 text-amber" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{bt.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {bt.phases === 3 ? `${bt.voltage}V 3Ø` : `${bt.voltage}V 1Ø`} — {bt.variants.length} variants
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bt.description}
                        </p>
                        <p className="text-xs text-amber mt-2">
                          {bt.variants.length} scenario{bt.variants.length !== 1 ? "s" : ""} — random selection each time
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Active Calculation Step */}
            {state.selectedScenario && !state.isComplete && currentStep && (() => {
              // HVAC motor sub-step
              const isHvacMotorSubStep = currentStep.id === "hvac" && (state.hvacSubStepIndex ?? 0) === 0;
              const hvacSub = isHvacMotorSubStep ? getHvacMotorSubStep(state.selectedScenario!, necVersion) : null;

              // Motor conversion sub-steps
              const isMotorSubStep = currentStep.id === "convert-motors";
              const subSteps = isMotorSubStep ? getMotorSubSteps(state.selectedScenario!) : [];
              const subIdx = state.motorSubStepIndex ?? 0;
              const currentSubStep = isMotorSubStep ? subSteps[subIdx] : null;

              let stepFormula: string | undefined;
              let stepNecRef: string;
              let stepHint: string;
              let canGoPrev: boolean;
              let motionKey: string;

              if (hvacSub) {
                stepFormula = hvacSub.formula;
                stepNecRef = hvacSub.necReference;
                stepHint = hvacSub.hint;
                canGoPrev = state.currentStepIndex > 0;
                motionKey = `${currentStep.id}-motor`;
              } else if (isMotorSubStep && currentSubStep) {
                stepFormula = `${currentSubStep.formula}  (Motor ${subIdx + 1} of ${subSteps.length})`;
                stepNecRef = currentSubStep.necReference;
                stepHint = currentSubStep.hint;
                canGoPrev = subIdx > 0 || state.currentStepIndex > 0;
                motionKey = `${currentStep.id}-${subIdx}`;
              } else {
                stepFormula = resolveFormula(currentStep, state.selectedScenario!, necVersion);
                stepNecRef = resolveNecReference(currentStep, necVersion);
                stepHint = getHintText(currentStep, state.selectedScenario!, state.answers, necVersion);
                canGoPrev = currentStep.id === "hvac" ? true : state.currentStepIndex > 0;
                motionKey = currentStep.id;
              }

              return (
                <motion.div
                  key={motionKey}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <StepInputArea
                    formula={stepFormula}
                    necReference={stepNecRef}
                    inputLabel={inputLabel}
                    inputMode="numeric"
                    placeholder="Enter your calculation..."
                    allowSlash={false}
                    rawInput={false}
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
                    totalSteps={COMMERCIAL_CALCULATION_STEPS.length}
                  />
                </motion.div>
              );
            })()}

            {/* Completion Screen */}
            {state.isComplete && completionResults && (
              <CompletionScreen
                results={completionResults}
                buildingDescription={`${state.selectedScenario?.squareFootage.toLocaleString()} sq ft ${state.selectedScenario?.name.toLowerCase()}`}
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
                {COMMERCIAL_CALCULATION_STEPS.map((step) => {
                  const answer = state.answers[step.id];
                  if (answer === undefined) return null;

                  const isBeginner = state.difficulty === "beginner";
                  const currentStepId = COMMERCIAL_CALCULATION_STEPS[state.currentStepIndex]?.id;
                  const isHighlighted = isBeginner && currentStepId === "total-va" && COMMERCIAL_TOTAL_VA_STEPS.includes(step.id);

                  // Format the value appropriately based on step type
                  let displayValue: string;
                  if (step.id === "service-conductor") {
                    const totalVA = state.answers["total-va"] || 0;
                    const amps = state.selectedScenario
                      ? getServiceAmps(totalVA, state.selectedScenario.voltage, state.selectedScenario.phases)
                      : totalVA / 240;
                    const conductor = getConductorSize(amps);
                    displayValue = `${conductor.size} AWG (${answer}A)`;
                  } else if (step.id === "gec-size") {
                    const gecVal = answer;
                    let gecLabel: string;
                    if (gecVal === 10) gecLabel = "1/0";
                    else if (gecVal === 20) gecLabel = "2/0";
                    else if (gecVal === 30) gecLabel = "3/0";
                    else gecLabel = `${gecVal}`;
                    displayValue = `${gecLabel} AWG`;
                  } else {
                    displayValue = `${answer.toLocaleString()} VA`;
                  }

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
                        {resolveTitle(step, necVersion).replace(/ \(.*\)/, "")}
                      </span>
                      <span className={`font-mono whitespace-nowrap text-xs ${
                        isHighlighted ? "text-amber dark:text-sparky-green font-semibold" : "text-foreground"
                      }`}>
                        {displayValue}
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
