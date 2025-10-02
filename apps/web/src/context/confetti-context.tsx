'use client';

import { useWindowSize } from '@bounty/ui/hooks/use-window-size';
import { useEffect, type ReactNode } from 'react';
import Confetti from 'react-confetti';
import { useConfettiStore } from '@/stores/confetti-store';

interface ConfettiProviderProps {
  children: ReactNode;
}

export function ConfettiProvider({ children }: ConfettiProviderProps) {
  const { shouldCelebrate, reset } = useConfettiStore();
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (shouldCelebrate) {
      const timer = setTimeout(() => reset(), 5000); // Confetti lasts for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [shouldCelebrate, reset]);

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
          recycle={false}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
          width={width}
        />
      )}
    </>
  );
}

export { useConfettiStore as useConfetti };
