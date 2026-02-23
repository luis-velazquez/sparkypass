"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { STATUS, type CallBackProps } from "react-joyride";
import { DASHBOARD_TOUR_STEPS } from "./tour-steps";
import { SparkyTooltip } from "./SparkyTooltip";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

interface DashboardTourProps {
  isActive: boolean;
  onComplete: () => void;
}

export function DashboardTour({ isActive, onComplete }: DashboardTourProps) {
  const router = useRouter();

  const steps = useMemo(() => {
    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 1280;

    return DASHBOARD_TOUR_STEPS.map((step) => {
      if (
        isMobile &&
        step.target === '[data-tour="nav-desktop"]'
      ) {
        return { ...step, target: '[data-tour="nav-mobile"]' };
      }
      return step;
    });
  }, []);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;

      if (status === STATUS.SKIPPED) {
        onComplete();
        return;
      }

      if (status === STATUS.FINISHED) {
        // Dashboard steps done → navigate to settings for final quiz prefs step
        onComplete();
        router.push("/settings?tour=1");
      }
    },
    [onComplete, router]
  );

  if (!isActive) return null;

  return (
    <Joyride
      run={isActive}
      steps={steps}
      continuous
      showSkipButton
      scrollToFirstStep
      scrollOffset={120}
      tooltipComponent={SparkyTooltip}
      callback={handleCallback}
      styles={{
        options: {
          overlayColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 60,
        },
        overlay: {
          zIndex: 60,
        },
        spotlight: {
          borderRadius: 12,
        },
      }}
      floaterProps={{
        styles: {
          floater: {
            zIndex: 70,
          },
        },
      }}
    />
  );
}
