import type { ReactGrabElementContext } from 'react-grab/primitives';

export type { ReactGrabElementContext };

export interface FeedbackConfig {
  endpoint?: string;
  metadata?: Record<string, string>;
  ui?: {
    title?: string;
    description?: string;
    placeholder?: string;
    submitLabel?: string;
    cancelLabel?: string;
    zIndex?: number;
  };
  onSubmit?: (data: FeedbackSubmission) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface FeedbackSubmission {
  comment: string;
  route: string;
  componentName?: string;
  selector?: string;
  metadata?: Record<string, string>;
  screenshot?: boolean;
}

export interface FeedbackContextType {
  isOpen: boolean;
  isSelecting: boolean;
  elementContext: ReactGrabElementContext | null;
  open: () => void;
  close: () => void;
  startSelection: () => void;
  cancelSelection: () => void;
  selectElement: (context: ReactGrabElementContext) => void;
  config: FeedbackConfig;
}
