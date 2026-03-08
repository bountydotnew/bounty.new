'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { ReactGrabElementContext } from 'react-grab/primitives';
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
  const [isSelecting, setIsSelecting] = useState(false);
  const [elementContext, setElementContext] =
    useState<ReactGrabElementContext | null>(null);

  const mergedConfig: FeedbackConfig = {
    ...config,
    endpoint: endpoint ?? '/api/feedback',
  };

  const open = useCallback(() => {
    setIsOpen(true);
    setIsSelecting(false);
    mergedConfig.onOpen?.();
  }, [mergedConfig]);

  const close = useCallback(() => {
    setIsOpen(false);
    setElementContext(null);
    setIsSelecting(false);
    mergedConfig.onClose?.();
  }, [mergedConfig]);

  const startSelection = useCallback(() => {
    setIsSelecting(true);
    setIsOpen(false);
  }, []);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const selectElement = useCallback(
    (context: ReactGrabElementContext) => {
      setElementContext(context);
      setIsSelecting(false);
      setIsOpen(true);
      mergedConfig.onOpen?.();
    },
    [mergedConfig]
  );

  return (
    <FeedbackContext
      value={{
        isOpen,
        isSelecting,
        elementContext,
        open,
        close,
        startSelection,
        cancelSelection,
        selectElement,
        config: mergedConfig,
      }}
    >
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
