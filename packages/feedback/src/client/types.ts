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
  metadata?: Record<string, string>;
  screenshot?: boolean;
}

export interface FeedbackContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  config: FeedbackConfig;
}
