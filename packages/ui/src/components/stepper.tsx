'use client';

import { Check, ChevronRight } from 'lucide-react';
import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface StepperContextType {
  currentStep: number;
  totalSteps: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isStepCompleted: (step: number) => boolean;
  isStepActive: (step: number) => boolean;
}

const StepperContext = createContext<StepperContextType | undefined>(undefined);

const useStepper = () => {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error('useStepper must be used within a Stepper');
  }
  return context;
};

interface StepperProps {
  children: React.ReactNode;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  children,
  currentStep = 0,
  onStepChange,
  className,
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);

  const childrenArray = React.Children.toArray(children);
  const totalSteps = childrenArray.length;

  const handleSetCurrentStep = (step: number) => {
    setActiveStep(step);
    onStepChange?.(step);
  };

  const nextStep = () => {
    if (activeStep < totalSteps - 1) {
      handleSetCurrentStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      handleSetCurrentStep(activeStep - 1);
    }
  };

  const isStepCompleted = (step: number) => activeStep > step;
  const isStepActive = (step: number) => activeStep === step;

  return (
    <StepperContext.Provider
      value={{
        currentStep: activeStep,
        totalSteps,
        setCurrentStep: handleSetCurrentStep,
        nextStep,
        prevStep,
        isStepCompleted,
        isStepActive,
      }}
    >
      <div className={cn('w-full', className)}>
        <StepperHeader />
        <div className="mt-6">
          {childrenArray[activeStep]}
        </div>
      </div>
    </StepperContext.Provider>
  );
};

const StepperHeader: React.FC = () => {
  const { currentStep, totalSteps, isStepCompleted, isStepActive } = useStepper();

  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }, (_, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200',
                {
                  // Completed step - using the comments section style
                  'border-neutral-700 bg-neutral-800/60 text-neutral-300': isStepCompleted(index),
                  // Active step - similar to the active button style in comments
                  'border-neutral-700 bg-neutral-800/60 text-white ring-1 ring-neutral-600': isStepActive(index),
                  // Future step
                  'border-neutral-800 bg-neutral-900/30 text-neutral-500': !isStepCompleted(index) && !isStepActive(index),
                }
              )}
            >
              {isStepCompleted(index) ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
          </div>
          {index < totalSteps - 1 && (
            <div className="flex-1 mx-2">
              <div
                className={cn(
                  'h-0.5 transition-all duration-200',
                  {
                    'bg-neutral-700': isStepCompleted(index),
                    'bg-neutral-800': !isStepCompleted(index),
                  }
                )}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface StepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Step: React.FC<StepProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h3 className="font-medium text-xl text-white">{title}</h3>
        {description && (
          <p className="text-neutral-400 text-sm">{description}</p>
        )}
      </div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6">
        {children}
      </div>
    </div>
  );
};

interface StepperNavigationProps {
  children?: React.ReactNode;
  className?: string;
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  backDisabled?: boolean;
}

export const StepperNavigation: React.FC<StepperNavigationProps> = ({
  children,
  className,
  showBack = true,
  showNext = true,
  nextLabel = 'Next',
  backLabel = 'Back',
  onNext,
  onBack,
  nextDisabled = false,
  backDisabled = false,
}) => {
  const { currentStep, totalSteps, nextStep, prevStep } = useStepper();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      prevStep();
    }
  };

  return (
    <div className={cn('flex justify-between items-center mt-6', className)}>
      <div>
        {showBack && currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={backDisabled}
            className="rounded-md border border-neutral-700 bg-transparent px-3 py-2 text-neutral-300 text-sm hover:bg-neutral-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {backLabel}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {children}
        {showNext && (
          <button
            type="button"
            onClick={handleNext}
            disabled={nextDisabled}
            className="flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-white text-sm hover:bg-neutral-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentStep === totalSteps - 1 ? 'Complete' : nextLabel}
            {currentStep < totalSteps - 1 && <ChevronRight className="h-3 w-3" />}
          </button>
        )}
      </div>
    </div>
  );
};

export { useStepper };