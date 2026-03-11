'use client';

import type React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactGrabElementContext } from 'react-grab/primitives';

/**
 * Configuration options for the Feedback system.
 */
interface FeedbackConfig {
  apiEndpoint?: string;
  metadata?: Record<string, string>;
  ui?: {
    title?: string;
    placeholder?: string;
    submitLabel?: string;
    cancelLabel?: string;
    zIndex?: number;
    colors?: {
      primary?: string;
    };
  };
  onFeedbackSubmit?: (data: Record<string, string>) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

interface FeedbackContextType {
  /** Whether the feedback modal is currently open */
  isFeedbackOpen: boolean;
  /** Whether the user is currently in "selection mode" */
  isSelecting: boolean;
  /** Rich element context from react-grab, if an element was selected */
  elementContext: ReactGrabElementContext | null;
  /** Opens the feedback modal directly, skipping selection */
  openFeedback: () => void;
  /** Closes the feedback modal and resets state */
  closeFeedback: () => void;
  /** Enters selection mode */
  startSelection: () => void;
  /** Cancels selection mode without opening the modal */
  cancelSelection: () => void;
  /** Sets the selected element context and opens the modal */
  selectElement: (context: ReactGrabElementContext) => void;
  /** Current configuration object */
  config: FeedbackConfig;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(
  undefined
);

const EMPTY_CONFIG: FeedbackConfig = {};

export function FeedbackProvider({
  children,
  config = EMPTY_CONFIG,
}: {
  children: React.ReactNode;
  config?: FeedbackConfig;
}) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [elementContext, setElementContext] =
    useState<ReactGrabElementContext | null>(null);

  const openFeedback = useCallback(() => {
    setIsFeedbackOpen(true);
    setIsSelecting(false);
    config.onOpen?.();
  }, [config]);

  const closeFeedback = useCallback(() => {
    setIsFeedbackOpen(false);
    setElementContext(null);
    setIsSelecting(false);
    config.onClose?.();
  }, [config]);

  const startSelection = useCallback(() => {
    setIsSelecting(true);
    setIsFeedbackOpen(false);
  }, []);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const selectElement = useCallback(
    (context: ReactGrabElementContext) => {
      setElementContext(context);
      setIsSelecting(false);
      setIsFeedbackOpen(true);
      config.onOpen?.();
    },
    [config]
  );

  return (
    <FeedbackContext.Provider
      value={{
        isFeedbackOpen,
        isSelecting,
        elementContext,
        openFeedback,
        closeFeedback,
        startSelection,
        cancelSelection,
        selectElement,
        config,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
