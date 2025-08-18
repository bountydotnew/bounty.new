"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/lib/hooks/use-window-size";
import type { ReactNode } from "react";

interface ConfettiContextType {
  celebrate: () => void;
}

const ConfettiContext = createContext<ConfettiContextType | undefined>(
  undefined,
);

export function ConfettiProvider({ children }: { children: ReactNode }) {
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
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          confettiSource={{
            x: 0,
            y: 0,
            w: width,
            h: 0,
          }}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999 }}
        />
      )}
    </ConfettiContext.Provider>
  );
}

export function useConfetti() {
  const context = useContext(ConfettiContext);
  if (context === undefined) {
    throw new Error("useConfetti must be used within a ConfettiProvider");
  }
  return context;
}
