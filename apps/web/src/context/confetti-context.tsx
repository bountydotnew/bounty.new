'use client';

import { useWindowSize } from '@bounty/ui/hooks/use-window-size';
import { useCallback, type ReactNode } from 'react';
import Confetti from 'react-confetti';
import { useConfettiStore } from '@/stores/confetti-store';

interface ConfettiProviderProps {
  children: ReactNode;
}

export function ConfettiProvider({ children }: ConfettiProviderProps) {
  const { shouldCelebrate, reset } = useConfettiStore();
  const { width, height } = useWindowSize();

  const handleConfettiComplete = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <>
      {children}
      {shouldCelebrate && width && height && (
        <Confetti
          confettiSource={{
            x: 0,
            y: 0,
            w: width,
            h: 0,
          }}
          height={height}
          numberOfPieces={500}
          onConfettiComplete={handleConfettiComplete}
          recycle={false}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
          width={width}
        />
      )}
    </>
  );
}

export { useConfettiStore as useConfetti };
