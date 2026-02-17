'use client';

import type React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Configuration options for the Feedback system.
 */
interface FeedbackConfig {
  /**
   * The API endpoint to submit feedback to.
   * @default "/api/feedback"
   */
  apiEndpoint?: string;
  /**
   * Additional metadata to send with every feedback report (e.g. user ID, version).
   */
  metadata?: Record<string, string>;
  /**
   * Custom UI configuration for the modal and overlay.
   */
  ui?: {
    /**
     * Title of the feedback modal.
     * @default "Send Feedback"
     */
    title?: string;
    /**
     * Placeholder text for the comment textarea.
     * @default "What seems to be the problem?"
     */
    placeholder?: string;
    /**
     * Label for the submit button.
     * @default "Send Feedback"
     */
    submitLabel?: string;
    /**
     * Label for the cancel button.
     * @default "Cancel"
     */
    cancelLabel?: string;
    /**
     * Custom z-index for the modal and overlay.
     * Useful if the modal is hidden behind other elements.
     * @default 10000
     */
    zIndex?: number;
    /**
     * Custom colors for the UI.
     */
    colors?: {
      /**
       * Primary color used for buttons and selection highlights.
       * @default "#E66700" (Orange)
       */
      primary?: string;
    };
  };
  /**
   * Callback fired when feedback is successfully submitted.
   */
  onFeedbackSubmit?: (data: Record<string, string>) => void;
  /**
   * Callback fired when the modal is opened.
   */
  onOpen?: () => void;
  /**
   * Callback fired when the modal is closed.
   */
  onClose?: () => void;
}

interface FeedbackContextType {
  /** Whether the feedback modal is currently open */
  isFeedbackOpen: boolean;
  /** Whether the user is currently in "selection mode" (hovering to pick an element) */
  isSelecting: boolean;
  /** The DOM element selected by the user, if any */
  selectedElement: HTMLElement | null;
  /** Opens the feedback modal directly, skipping selection */
  openFeedback: () => void;
  /** Closes the feedback modal and resets state */
  closeFeedback: () => void;
  /** Enters selection mode, allowing the user to click an element */
  startSelection: () => void;
  /** Cancels selection mode without opening the modal */
  cancelSelection: () => void;
  /** Programmatically selects an element and opens the modal */
  selectElement: (element: HTMLElement) => void;
  /** Current configuration object */
  config: FeedbackConfig;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(
  undefined
);

/**
 * Provider component for the Feedback system.
 * Wrap your application root with this to enable feedback functionality.
 */
export function FeedbackProvider({
  children,
  config = {},
}: {
  children: React.ReactNode;
  /** Optional configuration settings */
  config?: FeedbackConfig;
}) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );

  const openFeedback = useCallback(() => {
    setIsFeedbackOpen(true);
    setIsSelecting(false);
    config.onOpen?.();
  }, [config]);

  const closeFeedback = useCallback(() => {
    setIsFeedbackOpen(false);
    setSelectedElement(null);
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
    (element: HTMLElement) => {
      setSelectedElement(element);
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
        selectedElement,
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

/**
 * Hook to interact with the Feedback system.
 * @returns {FeedbackContextType} The feedback context interface
 * @throws {Error} If used outside of a FeedbackProvider
 */
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
