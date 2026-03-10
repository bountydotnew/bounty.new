'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import * as React from 'react';

import { cn } from '@bounty/ui/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TourStep {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  className?: string;
  nextRoute?: string;
  previousRoute?: string;
  nextLabel?: React.ReactNode;
  previousLabel?: React.ReactNode;
}

export interface Tour {
  id: string;
  steps: TourStep[];
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TourContextValue {
  start: (tourId: string) => void;
  close: () => void;
  next: () => void;
  previous: () => void;
  activeTourId: string | null;
  currentStepIndex: number;
  currentStep: TourStep | null;
  totalSteps: number;
  isActive: boolean;
}

const TourContext = React.createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = React.useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// TourProvider
// ---------------------------------------------------------------------------

export function TourProvider({
  tours,
  children,
  onTourComplete,
  onNavigate,
}: {
  tours: Tour[];
  children: React.ReactNode;
  onTourComplete?: (tourId: string) => void;
  onNavigate?: (route: string) => void;
}) {
  const [activeTourId, setActiveTourId] = React.useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [anchorElement, setAnchorElement] = React.useState<Element | null>(
    null
  );

  const activeTour = tours.find((t) => t.id === activeTourId);
  const currentStep = activeTour?.steps[currentStepIndex] ?? null;
  const totalSteps = activeTour?.steps.length ?? 0;
  const isActive = !!activeTourId && !!currentStep;

  // Find and observe target element
  React.useEffect(() => {
    if (!currentStep) {
      setAnchorElement(null);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20; // 2 seconds total

    const findElement = () => {
      const el = document.querySelector(
        `[data-tour-step-id="${currentStep.id}"]`
      );
      if (el) {
        setAnchorElement(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight ring
        el.setAttribute('data-tour-active', 'true');
        return true;
      }
      return false;
    };

    // Try immediately
    if (findElement()) return;

    // Retry with polling for route transitions
    const interval = setInterval(() => {
      attempts++;
      if (findElement() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      // Clean up highlight
      document
        .querySelectorAll('[data-tour-active]')
        .forEach((el) => el.removeAttribute('data-tour-active'));
    };
  }, [currentStep?.id, currentStepIndex, activeTourId]);

  const start = React.useCallback((tourId: string) => {
    setActiveTourId(tourId);
    setCurrentStepIndex(0);
  }, []);

  const close = React.useCallback(() => {
    if (activeTourId) {
      onTourComplete?.(activeTourId);
    }
    setActiveTourId(null);
    setCurrentStepIndex(0);
    setAnchorElement(null);
    document
      .querySelectorAll('[data-tour-active]')
      .forEach((el) => el.removeAttribute('data-tour-active'));
  }, [activeTourId, onTourComplete]);

  const next = React.useCallback(() => {
    if (!activeTour) return;
    if (currentStepIndex < activeTour.steps.length - 1) {
      const step = activeTour.steps[currentStepIndex];
      if (step?.nextRoute && onNavigate) {
        onNavigate(step.nextRoute);
      }
      setCurrentStepIndex((i) => i + 1);
    } else {
      close();
    }
  }, [activeTour, currentStepIndex, onNavigate, close]);

  const previous = React.useCallback(() => {
    if (currentStepIndex > 0) {
      const step = activeTour?.steps[currentStepIndex];
      if (step?.previousRoute && onNavigate) {
        onNavigate(step.previousRoute);
      }
      setCurrentStepIndex((i) => i - 1);
    }
  }, [activeTour, currentStepIndex, onNavigate]);

  const contextValue: TourContextValue = React.useMemo(
    () => ({
      start,
      close,
      next,
      previous,
      activeTourId,
      currentStepIndex,
      currentStep,
      totalSteps,
      isActive,
    }),
    [
      start,
      close,
      next,
      previous,
      activeTourId,
      currentStepIndex,
      currentStep,
      totalSteps,
      isActive,
    ]
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}

      {/* Global highlight styles */}
      {isActive && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              [data-tour-active="true"] {
                position: relative;
                z-index: 9998 !important;
                box-shadow: 0 0 0 4px hsl(var(--brand-primary) / 0.3), 0 0 0 2px hsl(var(--brand-primary) / 0.6);
                border-radius: 12px;
                transition: box-shadow 0.3s ease;
              }
              .tour-backdrop {
                position: fixed;
                inset: 0;
                z-index: 9997;
                background: rgba(0, 0, 0, 0.5);
                pointer-events: auto;
              }
            `,
          }}
        />
      )}

      {/* Backdrop */}
      {isActive && <div className="tour-backdrop" onClick={close} />}

      {/* Step popover */}
      {isActive && currentStep && anchorElement && (
        <TourStepPopover
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          anchor={anchorElement}
          onNext={next}
          onPrevious={previous}
          onClose={close}
        />
      )}
    </TourContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TourStepPopover - Uses BaseUI Popover positioned against the target element
// ---------------------------------------------------------------------------

function TourStepPopover({
  step,
  stepIndex,
  totalSteps,
  anchor,
  onNext,
  onPrevious,
  onClose,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  anchor: Element;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <PopoverPrimitive.Root open>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchor}
          side={step.side || 'bottom'}
          sideOffset={step.sideOffset || 16}
          align={step.align || 'start'}
          alignOffset={step.alignOffset || 0}
          className="z-[9999]"
        >
          <PopoverPrimitive.Popup
            className={cn(
              'w-[320px] rounded-xl border bg-popover text-popover-foreground shadow-lg/5',
              'before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-xl)-1px)]',
              'before:shadow-[0_1px_--theme(--color-black/6%)]',
              'dark:before:shadow-[0_-1px_--theme(--color-white/6%)]',
              step.className
            )}
          >
            <div className="p-4">
              {/* Step counter */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-text-tertiary">
                  {stepIndex + 1} of {totalSteps}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-text-tertiary hover:text-foreground transition-colors text-xs"
                >
                  Skip tour
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-3 h-0.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all duration-500 ease-out"
                  style={{
                    width: `${((stepIndex + 1) / totalSteps) * 100}%`,
                  }}
                />
              </div>

              {/* Content */}
              <div className="mb-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                {step.content}
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-2">
                {!isFirst ? (
                  <button
                    type="button"
                    onClick={onPrevious}
                    className="h-[29px] rounded-lg px-3 text-xs font-medium text-text-secondary hover:text-foreground hover:bg-surface-hover transition-colors"
                  >
                    {step.previousLabel || 'Previous'}
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={onNext}
                  className="h-[29px] rounded-lg bg-foreground px-4 text-xs font-medium text-background hover:bg-foreground/90 transition-colors"
                >
                  {step.nextLabel || (isLast ? 'Finish' : 'Next')}
                </button>
              </div>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
