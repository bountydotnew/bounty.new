'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import type {
  ConfettiContextType,
  ConfettiProviderProps,
} from '@/types/confetti';

const ConfettiContext = createContext<ConfettiContextType | undefined>(
  undefined
);

export function ConfettiProvider({ children }: ConfettiProviderProps) {
  const [shouldCelebrate, setShouldCelebrate] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (shouldCelebrate) {
      const timer = setTimeout(() => setShouldCelebrate(false), 5000); // Confetti lasts for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [shouldCelebrate]);

  const celebrate = () => {
    setShouldCelebrate(true);
  };

  return (
    <ConfettiContext.Provider value={{ celebrate }}>
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
    </ConfettiContext.Provider>
  );
}

export function useConfetti() {
  const context = useContext(ConfettiContext);
  if (context === undefined) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
}
