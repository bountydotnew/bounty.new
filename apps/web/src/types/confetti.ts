import type { ReactNode } from 'react';

export interface ConfettiContextType {
  celebrate: () => void;
}

export interface ConfettiProviderProps {
  children: ReactNode;
}
