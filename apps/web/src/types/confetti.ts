import type { ReactNode } from 'react';

interface ConfettiContextType {
  celebrate: () => void;
}

interface ConfettiProviderProps {
  children: ReactNode;
}
