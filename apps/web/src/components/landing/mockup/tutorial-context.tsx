'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const TUTORIAL_STEPS = ['create-bounty', 'stripe-pay', 'complete'] as const;
type TutorialStep = (typeof TUTORIAL_STEPS)[number];

interface TutorialContextValue {
  currentStep: TutorialStep;
  stepIndex: number;
  isActive: boolean;
  isStepActive: (stepId: string) => boolean;
  advanceStep: () => void;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

interface TutorialProviderProps {
  children: ReactNode;
  /** Start tutorial automatically (default: true) */
  autoStart?: boolean;
}

export function TutorialProvider({
  children,
  autoStart = true,
}: TutorialProviderProps) {
  const [stepIndex, setStepIndex] = useState(0);
  // Use autoStart only for initial state - uncontrolled pattern
  const [isActive, setIsActive] = useState(() => autoStart);

  const currentStep = TUTORIAL_STEPS[stepIndex] ?? 'complete';

  const isStepActive = useCallback(
    (stepId: string) => {
      return isActive && currentStep === stepId;
    },
    [isActive, currentStep]
  );

  const advanceStep = useCallback(() => {
    setStepIndex((prev) => {
      const next = prev + 1;
      if (next >= TUTORIAL_STEPS.length) {
        setIsActive(false);
        return prev;
      }
      return next;
    });
  }, []);

  const resetTutorial = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      currentStep,
      stepIndex,
      isActive,
      isStepActive,
      advanceStep,
      resetTutorial,
    }),
    [currentStep, stepIndex, isActive, isStepActive, advanceStep, resetTutorial]
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

export function useTutorialOptional(): TutorialContextValue | null {
  return useContext(TutorialContext);
}
