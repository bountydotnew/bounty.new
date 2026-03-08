'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { FeedbackConfig, FeedbackContextType } from './types';

const FeedbackContext = createContext<FeedbackContextType | null>(null);

const EMPTY_CONFIG: FeedbackConfig = {};

export function FeedbackProvider({
  children,
  config = EMPTY_CONFIG,
  endpoint,
}: {
  children: ReactNode;
  config?: Omit<FeedbackConfig, 'endpoint'>;
  endpoint?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const mergedConfig: FeedbackConfig = {
    ...config,
    endpoint: endpoint ?? '/api/feedback',
  };

  const open = useCallback(() => {
    setIsOpen(true);
    mergedConfig.onOpen?.();
  }, [mergedConfig]);

  const close = useCallback(() => {
    setIsOpen(false);
    mergedConfig.onClose?.();
  }, [mergedConfig]);

  return (
    <FeedbackContext value={{ isOpen, open, close, config: mergedConfig }}>
      {children}
    </FeedbackContext>
  );
}

export function useFeedback(): FeedbackContextType {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within <FeedbackProvider>');
  }
  return ctx;
}
