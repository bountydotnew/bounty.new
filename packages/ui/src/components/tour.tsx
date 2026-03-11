'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
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
// Session storage key for cross-page persistence
// ---------------------------------------------------------------------------

const TOUR_STORAGE_KEY = 'bounty-active-tour';

interface PersistedTourState {
  tourId: string;
  stepIndex: number;
}

function persistTourState(state: PersistedTourState | null) {
  try {
    if (state) {
      sessionStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(TOUR_STORAGE_KEY);
    }
  } catch {
    // sessionStorage may not be available
  }
}

function loadPersistedTourState(): PersistedTourState | null {
  try {
    const raw = sessionStorage.getItem(TOUR_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistedTourState;
    }
  } catch {
    // ignore
  }
  return null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TourContextValue {
  start: (tourId: string) => void;
  close: () => void;
  dismiss: () => void;
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
// Helpers
// ---------------------------------------------------------------------------

function getElementRect(el: Element): DOMRect {
  return el.getBoundingClientRect();
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
  const [targetElement, setTargetElement] = React.useState<Element | null>(
    null
  );
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  const activeTour = tours.find((t) => t.id === activeTourId);
  const currentStep = activeTour?.steps[currentStepIndex] ?? null;
  const totalSteps = activeTour?.steps.length ?? 0;
  const isActive = !!activeTourId && !!currentStep;

  // Restore persisted tour state on mount (cross-page navigation)
  React.useEffect(() => {
    const persisted = loadPersistedTourState();
    if (persisted && tours.some((t) => t.id === persisted.tourId)) {
      setActiveTourId(persisted.tourId);
      setCurrentStepIndex(persisted.stepIndex);
      // Clear it so it doesn't re-trigger on subsequent mounts
      persistTourState(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Find and track target element
  React.useEffect(() => {
    if (!currentStep) {
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // 3 seconds total

    const findElement = () => {
      const el = document.querySelector(
        `[data-tour-step-id="${currentStep.id}"]`
      );
      if (el) {
        setTargetElement(el);
        setTargetRect(getElementRect(el));
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Recalculate rect after scroll settles
        setTimeout(() => {
          setTargetRect(getElementRect(el));
        }, 400);
        return true;
      }
      return false;
    };

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
    };
  }, [currentStep?.id, currentStepIndex, activeTourId]);

  // Keep rect in sync on scroll/resize
  React.useEffect(() => {
    if (!targetElement || !isActive) return;

    const update = () => {
      setTargetRect(getElementRect(targetElement));
    };

    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [targetElement, isActive]);

  const dismiss = React.useCallback(() => {
    setActiveTourId(null);
    setCurrentStepIndex(0);
    setTargetElement(null);
    setTargetRect(null);
    persistTourState(null);
  }, []);

  const close = React.useCallback(() => {
    if (activeTourId) {
      onTourComplete?.(activeTourId);
    }
    dismiss();
  }, [activeTourId, onTourComplete, dismiss]);

  const start = React.useCallback(
    (tourId: string) => {
      setActiveTourId(tourId);
      setCurrentStepIndex(0);
      setTargetElement(null);
      setTargetRect(null);
      // Persist so it survives cross-page navigation
      persistTourState({ tourId, stepIndex: 0 });
    },
    []
  );

  const next = React.useCallback(() => {
    if (!activeTour) return;
    if (currentStepIndex < activeTour.steps.length - 1) {
      const step = activeTour.steps[currentStepIndex];
      const nextIndex = currentStepIndex + 1;
      if (step?.nextRoute && onNavigate) {
        // Persist state before navigating to another page
        persistTourState({ tourId: activeTour.id, stepIndex: nextIndex });
        onNavigate(step.nextRoute);
      }
      setTargetElement(null);
      setTargetRect(null);
      setCurrentStepIndex(nextIndex);
    } else {
      close();
    }
  }, [activeTour, currentStepIndex, onNavigate, close]);

  const previous = React.useCallback(() => {
    if (currentStepIndex > 0) {
      const step = activeTour?.steps[currentStepIndex];
      const prevIndex = currentStepIndex - 1;
      if (step?.previousRoute && onNavigate) {
        persistTourState({
          tourId: activeTour!.id,
          stepIndex: prevIndex,
        });
        onNavigate(step.previousRoute);
      }
      setTargetElement(null);
      setTargetRect(null);
      setCurrentStepIndex(prevIndex);
    }
  }, [activeTour, currentStepIndex, onNavigate]);

  const contextValue: TourContextValue = React.useMemo(
    () => ({
      start,
      close,
      dismiss,
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
      dismiss,
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
      {isActive && currentStep && targetRect && (
        <TourOverlay
          targetRect={targetRect}
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onNext={next}
          onPrevious={previous}
          onClose={close}
          onDismiss={dismiss}
        />
      )}
    </TourContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TourOverlay — SVG mask approach for spotlight cutout
// ---------------------------------------------------------------------------

function TourOverlay({
  targetRect,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
  onDismiss,
}: {
  targetRect: DOMRect;
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onDismiss: () => void;
}) {
  const padding = 8;
  const borderRadius = 12;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  // Calculate popover position
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  // Track whether we've done an initial position so we can enable transitions
  const hasPositioned = React.useRef(false);

  React.useLayoutEffect(() => {
    if (!popoverRef.current) return;
    const popRect = popoverRef.current.getBoundingClientRect();
    const side = step.side || 'bottom';
    const sideOffset = step.sideOffset ?? 16;
    const align = step.align || 'start';

    let top = 0;
    let left = 0;

    // Calculate side position
    switch (side) {
      case 'bottom':
        top = targetRect.bottom + padding + sideOffset;
        break;
      case 'top':
        top = targetRect.top - padding - sideOffset - popRect.height;
        break;
      case 'left':
        left = targetRect.left - padding - sideOffset - popRect.width;
        top = targetRect.top - padding;
        break;
      case 'right':
        left = targetRect.right + padding + sideOffset;
        top = targetRect.top - padding;
        break;
    }

    // Calculate alignment for top/bottom sides
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          left = targetRect.left - padding;
          break;
        case 'center':
          left =
            targetRect.left + targetRect.width / 2 - popRect.width / 2;
          break;
        case 'end':
          left = targetRect.right + padding - popRect.width;
          break;
      }
    }

    // Calculate alignment for left/right sides
    if (side === 'left' || side === 'right') {
      switch (align) {
        case 'start':
          top = targetRect.top - padding;
          break;
        case 'center':
          top =
            targetRect.top + targetRect.height / 2 - popRect.height / 2;
          break;
        case 'end':
          top = targetRect.bottom + padding - popRect.height;
          break;
      }
    }

    // Clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    left = Math.max(12, Math.min(left, vw - popRect.width - 12));
    top = Math.max(12, Math.min(top, vh - popRect.height - 12));

    setPopoverPos({ top, left });

    // Mark that we've done the first layout — after this, transitions kick in
    if (!hasPositioned.current) {
      // Use rAF to ensure the initial position is painted before enabling transitions
      requestAnimationFrame(() => {
        hasPositioned.current = true;
      });
    }
  }, [targetRect, step.side, step.sideOffset, step.align]);

  // Reset hasPositioned when stepIndex changes so we don't animate from old position
  React.useEffect(() => {
    hasPositioned.current = false;
    setPopoverPos(null);
  }, [stepIndex]);

  const cutout = {
    x: targetRect.left - padding,
    y: targetRect.top - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  // Use CSS transitions only after first position is set to avoid jarring entrance
  const enableTransitions = hasPositioned.current && popoverPos !== null;

  return createPortal(
    <div
      className="tour-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 99990 }}
    >
      {/* SVG overlay with spotlight cutout */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={cutout.x}
              y={cutout.y}
              width={cutout.width}
              height={cutout.height}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
              style={
                enableTransitions
                  ? {
                      transition:
                        'x 0.35s cubic-bezier(0.4,0,0.2,1), y 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)',
                    }
                  : undefined
              }
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#tour-spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={onDismiss}
        />
      </svg>

      {/* Highlight ring around target */}
      <div
        style={{
          position: 'fixed',
          top: cutout.y,
          left: cutout.x,
          width: cutout.width,
          height: cutout.height,
          borderRadius: borderRadius,
          boxShadow:
            '0 0 0 2px rgba(74, 111, 220, 0.6), 0 0 0 4px rgba(74, 111, 220, 0.25)',
          pointerEvents: 'none',
          transition: enableTransitions
            ? 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)'
            : 'none',
        }}
      />

      {/* Popover card */}
      <div
        ref={popoverRef}
        className={cn(
          'w-[320px] rounded-xl border bg-popover text-popover-foreground shadow-lg',
          step.className
        )}
        style={{
          position: 'fixed',
          top: popoverPos?.top ?? -9999,
          left: popoverPos?.left ?? -9999,
          zIndex: 99991,
          // Only transition after initial position is painted
          transition: enableTransitions
            ? 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease'
            : 'none',
          opacity: popoverPos ? 1 : 0,
        }}
      >
        <div className="p-4">
          {/* Step counter */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-tertiary">
              {stepIndex + 1} of {totalSteps}
            </span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-text-tertiary hover:text-foreground transition-colors text-xs"
            >
              Skip tour
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-3 h-0.5 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full bg-[#4A6FDC] transition-all duration-500 ease-out"
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
      </div>
    </div>,
    document.body
  );
}
