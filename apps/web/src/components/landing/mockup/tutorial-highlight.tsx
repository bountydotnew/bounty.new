'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { useTutorialOptional } from './tutorial-context';

const emptySubscribe = () => () => {};

interface TutorialHighlightProps {
  /** The step ID this highlight corresponds to */
  stepId: string;
  /** Tooltip text to display */
  tooltip: string;
  /** Position of the tooltip relative to the element */
  tooltipPosition?: 'top' | 'bottom';
  /** Border radius for the highlight ring (e.g., 'rounded-full', 'rounded-md', 'rounded-xl') */
  borderRadius?: string;
  /** Whether the wrapper should be full width (for buttons like Pay) */
  fullWidth?: boolean;
  /** Children to wrap */
  children: ReactNode;
}

export function TutorialHighlight({
  stepId,
  tooltip,
  tooltipPosition = 'top',
  borderRadius = 'rounded-xl',
  fullWidth = false,
  children,
}: TutorialHighlightProps) {
  const tutorial = useTutorialOptional();
  const isActive = tutorial?.isStepActive(stepId) ?? false;
  const contentRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!(isActive && contentRef.current)) {
      return;
    }

    const updatePosition = () => {
      const targetEl = contentRef.current
        ?.firstElementChild as HTMLElement | null;
      const rect =
        targetEl?.getBoundingClientRect() ??
        contentRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const x = rect.left + rect.width / 2;
      const y = tooltipPosition === 'top' ? rect.top - 12 : rect.bottom + 12;
      setTooltipPos({ x, y });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, tooltipPosition]);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}>
      {/* Glow effect behind the element */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className={`-inset-1 absolute ${borderRadius} pointer-events-none z-0`}
            exit={{ opacity: 0, scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Pulsing glow */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 oklch(62% 0.21 255 / 40%)',
                  '0 0 0 8px oklch(62% 0.21 255 / 0%)',
                ],
              }}
              className={`absolute inset-0 ${borderRadius} bg-blue-500/20`}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeOut',
              }}
            />
            {/* Static ring */}
            <div
              className={`absolute inset-0 ${borderRadius} ring-2 ring-blue-500/60 ring-offset-2 ring-offset-black`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The actual element */}
      <div
        className={`relative z-10 ${fullWidth ? 'w-full' : ''}`}
        ref={contentRef}
      >
        {children}
      </div>

      {/* Tooltip rendered via portal to escape overflow constraints */}
      {mounted &&
        isActive &&
        createPortal(
          <AnimatePresence>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-none fixed z-[9999]"
              exit={{ opacity: 0, y: tooltipPosition === 'top' ? 4 : -4 }}
              initial={{ opacity: 0, y: tooltipPosition === 'top' ? 4 : -4 }}
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: `translate(-50%, ${tooltipPosition === 'top' ? '-100%' : '0'})`,
              }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="relative">
                {/* Tooltip card */}
                <div className="whitespace-nowrap rounded-lg border border-border-default bg-surface-1 px-3 py-2 shadow-xl">
                  <span className="font-medium text-foreground text-sm">
                    {tooltip}
                  </span>
                </div>

                {/* Arrow */}
                <div
                  className={`-translate-x-1/2 absolute left-1/2 h-2 w-2 rotate-45 border-border-default bg-surface-1 ${
                    tooltipPosition === 'top'
                      ? '-mt-1 top-full border-r border-b'
                      : '-mb-1 bottom-full border-t border-l'
                  }`}
                />
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
