"use client";

import { useWalkthrough } from "./walkthrough-provider";
import { WelcomeModal } from "./welcome-modal";
import { CompletionModal } from "./completion-modal";
import { SpotlightOverlay } from "./spotlight-overlay";
import { WalkthroughTooltip } from "./walkthrough-tooltip";

interface WalkthroughOverlayProps {
  organizationName?: string;
  serviceType?: string;
  gapCount?: number;
}

export function WalkthroughOverlay({
  organizationName,
  serviceType,
  gapCount,
}: WalkthroughOverlayProps) {
  const {
    isActive,
    currentStep,
    stepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipWalkthrough,
    progress,
  } = useWalkthrough();

  if (!isActive || !currentStep) return null;

  if (currentStep.id === "1-0") {
    return (
      <WelcomeModal
        organizationName={organizationName}
        serviceType={serviceType}
        gapCount={gapCount}
        onStart={nextStep}
        onSkip={skipWalkthrough}
      />
    );
  }

  if (currentStep.id === "1-11") {
    return <CompletionModal onComplete={nextStep} />;
  }

  if (currentStep.type === "spotlight" && currentStep.targetSelector) {
    return (
      <SpotlightOverlay
        targetSelector={currentStep.targetSelector}
        animation={currentStep.animation}
      >
        <WalkthroughTooltip
          title={currentStep.title}
          icon={currentStep.icon}
          content={currentStep.content}
          position={currentStep.position}
          targetSelector={currentStep.targetSelector}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          onNext={nextStep}
          onBack={prevStep}
          onSkip={skipWalkthrough}
        />
      </SpotlightOverlay>
    );
  }

  return null;
}
