"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPatch } from "@/lib/api-client";
import {
  DEFAULT_PROGRESS,
  PHASE_1_STEPS,
  type PhaseStatus,
  type WalkthroughProgress,
  type WalkthroughStep,
} from "./walkthrough-config";

const STORAGE_KEY = "cqc_walkthrough_progress";

interface WalkthroughContextValue {
  progress: WalkthroughProgress;
  isActive: boolean;
  currentStep: WalkthroughStep | null;
  stepIndex: number;
  totalSteps: number;
  startWalkthrough: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipWalkthrough: () => void;
  restartWalkthrough: () => void;
  dismissTip: (tipId: string) => void;
  isTipDismissed: (tipId: string) => boolean;
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

const FALLBACK: WalkthroughContextValue = {
  progress: DEFAULT_PROGRESS,
  isActive: false,
  currentStep: null,
  stepIndex: 0,
  totalSteps: 0,
  startWalkthrough: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipWalkthrough: () => {},
  restartWalkthrough: () => {},
  dismissTip: () => {},
  isTipDismissed: () => false,
};

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext);
  return ctx ?? FALLBACK;
}

function loadProgress(): WalkthroughProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_PROGRESS;
}

function saveProgress(progress: WalkthroughProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

async function syncToServer(progress: WalkthroughProgress) {
  try {
    await apiPatch("/api/walkthrough", {
      phase1Status: progress.phase1Status,
      phase1CurrentStep: progress.phase1CurrentStep,
      phasesCompleted: progress.phasesCompleted,
      dismissedTips: progress.dismissedTips,
      completedFlows: progress.completedFlows,
      checklistCompleted: progress.checklistCompleted,
      checklistDismissed: progress.checklistDismissed,
    });
  } catch {}
}

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState<WalkthroughProgress>(DEFAULT_PROGRESS);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const local = loadProgress();
    setProgressState(local);

    apiGet<WalkthroughProgress>("/api/walkthrough")
      .then((res) => {
        const server = res.data;
        if (
          server.phase1Status !== "NOT_STARTED" ||
          server.phasesCompleted.length > 0
        ) {
          setProgressState(server);
          saveProgress(server);
        }
      })
      .catch(() => {})
      .finally(() => setInitialized(true));
  }, []);

  const setProgress = useCallback(
    (updater: (prev: WalkthroughProgress) => WalkthroughProgress) => {
      setProgressState((prev) => {
        const next = updater(prev);
        saveProgress(next);
        syncToServer(next);
        return next;
      });
    },
    [],
  );

  const isActive =
    progress.phase1Status === "IN_PROGRESS" &&
    progress.phase1CurrentStep >= 0 &&
    progress.phase1CurrentStep < PHASE_1_STEPS.length;

  const currentStep = isActive
    ? PHASE_1_STEPS[progress.phase1CurrentStep]
    : null;

  const startWalkthrough = useCallback(() => {
    setProgress((p) => ({
      ...p,
      phase1Status: "IN_PROGRESS" as PhaseStatus,
      phase1CurrentStep: 0,
    }));
  }, [setProgress]);

  const nextStep = useCallback(() => {
    setProgress((p) => {
      const next = p.phase1CurrentStep + 1;
      if (next >= PHASE_1_STEPS.length) {
        return {
          ...p,
          phase1Status: "COMPLETED" as PhaseStatus,
          phase1CurrentStep: PHASE_1_STEPS.length - 1,
          phasesCompleted: [...new Set([...p.phasesCompleted, 1])],
          checklistCompleted: [...new Set([...p.checklistCompleted, "complete-tour"])],
        };
      }
      return { ...p, phase1CurrentStep: next };
    });
  }, [setProgress]);

  const prevStep = useCallback(() => {
    setProgress((p) => ({
      ...p,
      phase1CurrentStep: Math.max(0, p.phase1CurrentStep - 1),
    }));
  }, [setProgress]);

  const skipWalkthrough = useCallback(() => {
    setProgress((p) => ({
      ...p,
      phase1Status: "SKIPPED" as PhaseStatus,
    }));
  }, [setProgress]);

  const restartWalkthrough = useCallback(() => {
    setProgress((p) => ({
      ...p,
      phase1Status: "IN_PROGRESS" as PhaseStatus,
      phase1CurrentStep: 0,
    }));
  }, [setProgress]);

  const dismissTip = useCallback(
    (tipId: string) => {
      setProgress((p) => ({
        ...p,
        dismissedTips: [...new Set([...p.dismissedTips, tipId])],
      }));
    },
    [setProgress],
  );

  const isTipDismissed = useCallback(
    (tipId: string) => progress.dismissedTips.includes(tipId),
    [progress.dismissedTips],
  );

  const value = useMemo(
    (): WalkthroughContextValue => ({
      progress,
      isActive,
      currentStep,
      stepIndex: progress.phase1CurrentStep,
      totalSteps: PHASE_1_STEPS.length,
      startWalkthrough,
      nextStep,
      prevStep,
      skipWalkthrough,
      restartWalkthrough,
      dismissTip,
      isTipDismissed,
    }),
    [
      progress,
      isActive,
      currentStep,
      startWalkthrough,
      nextStep,
      prevStep,
      skipWalkthrough,
      restartWalkthrough,
      dismissTip,
      isTipDismissed,
    ],
  );

  if (!initialized) return <>{children}</>;

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  );
}
