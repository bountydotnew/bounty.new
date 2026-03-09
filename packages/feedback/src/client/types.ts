/**
 * Locally declared to avoid build failures when react-grab/primitives
 * can't be resolved by the bundler (e.g. Turbopack).
 * Mirrors the shape exported by react-grab/primitives.
 */
export interface ReactGrabElementContext {
  element: Element;
  htmlPreview: string;
  stackString: string;
  stack: Array<{
    args?: unknown[];
    columnNumber?: number;
    lineNumber?: number;
    fileName?: string;
    functionName?: string;
    source?: string;
    isServer?: boolean;
    isSymbolicated?: boolean;
  }>;
  componentName: string | null;
  fiber: unknown;
  selector: string | null;
  styles: string;
}

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
