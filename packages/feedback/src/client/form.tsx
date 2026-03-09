'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from 'react';
import { useFeedback } from './context';

/**
 * Headless feedback form content. Render inside your own dialog/modal.
 *
 * @example
 * ```tsx
 * import { Dialog, DialogContent } from '@/components/ui/dialog';
 * import { FeedbackForm, useFeedback } from '@bounty/feedback';
 *
 * function MyFeedback() {
 *   const { isOpen, close } = useFeedback();
 *   return (
 *     <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
 *       <DialogContent>
 *         <FeedbackForm />
 *       </DialogContent>
 *     </Dialog>
 *   );
 * }
 * ```
 */
export function FeedbackForm({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, close, elementContext, config } = useFeedback();
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [prompt, setPrompt] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ui = {
    placeholder: config.ui?.placeholder ?? 'Describe the issue...',
    submitLabel: config.ui?.submitLabel ?? 'Send Feedback',
    cancelLabel: config.ui?.cancelLabel ?? 'Cancel',
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (status === 'sending') {
      return;
    }
    setStatus('idle');
    setErrorMessage(null);
    setComment('');
    setPrompt('');
    setIncludeScreenshot(true);
    close();
  }, [status, close]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!comment.trim()) {
        return;
      }
      setStatus('sending');

      try {
        let screenshotBlob: Blob | null = null;
        if (includeScreenshot) {
          try {
            const html2canvas = (await import('html2canvas-pro')).default;

            const selectedRect = elementContext?.element
              ? elementContext.element.getBoundingClientRect()
              : null;
            const highlightLabel =
              elementContext?.componentName ??
              elementContext?.selector ??
              'Selected';

            const canvas = await html2canvas(document.body, {
              logging: false,
              width: window.innerWidth,
              height: window.innerHeight,
              scrollX: -window.scrollX,
              scrollY: -window.scrollY,
              windowWidth: window.innerWidth,
              windowHeight: window.innerHeight,
              onclone: (clonedDoc) => {
                // Remove only the feedback UI elements, not other dialogs
                // the user may be reporting bugs about
                for (const el of clonedDoc.querySelectorAll(
                  '[data-feedback-ui], [data-feedback-ignore]'
                )) {
                  el.remove();
                }
                const overlay = clonedDoc.getElementById(
                  'feedback-overlay-layer'
                );
                if (overlay) {
                  overlay.remove();
                }

                for (const el of clonedDoc.querySelectorAll(
                  '[data-privacy="masked"]'
                )) {
                  (el as HTMLElement).style.filter = 'blur(10px)';
                }

                if (selectedRect) {
                  const highlight = clonedDoc.createElement('div');
                  Object.assign(highlight.style, {
                    position: 'fixed',
                    top: `${selectedRect.top}px`,
                    left: `${selectedRect.left}px`,
                    width: `${selectedRect.width}px`,
                    height: `${selectedRect.height}px`,
                    border: '2px solid #3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: '3px',
                    zIndex: '999999',
                    pointerEvents: 'none',
                  });
                  clonedDoc.body.appendChild(highlight);

                  const label = clonedDoc.createElement('div');
                  Object.assign(label.style, {
                    position: 'fixed',
                    top: `${Math.max(selectedRect.top - 24, 4)}px`,
                    left: `${selectedRect.left}px`,
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: '500',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    zIndex: '999999',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  });
                  label.textContent = highlightLabel;
                  clonedDoc.body.appendChild(label);
                }
              },
            });

            screenshotBlob = await new Promise<Blob>((resolve, reject) =>
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
                'image/png'
              )
            );
          } catch {
            // screenshot is best-effort
          }
        }

        const route = window.location.pathname;

        const formData = new FormData();
        formData.append('comment', comment.trim());
        formData.append('route', route);
        formData.append('userAgent', navigator.userAgent);

        if (prompt.trim()) {
          formData.append('prompt', prompt.trim());
        }

        if (config.metadata) {
          formData.append('metadata', JSON.stringify(config.metadata));
        }

        if (elementContext) {
          formData.append(
            'element',
            JSON.stringify({
              componentName: elementContext.componentName,
              selector: elementContext.selector,
              htmlPreview: elementContext.htmlPreview,
              stack: elementContext.stack.map(
                (frame: {
                  functionName?: string;
                  fileName?: string;
                  lineNumber?: number;
                  columnNumber?: number;
                }) => ({
                  functionName: frame.functionName,
                  fileName: frame.fileName,
                  lineNumber: frame.lineNumber,
                  columnNumber: frame.columnNumber,
                })
              ),
            })
          );
        }

        if (screenshotBlob) {
          formData.append('screenshot', screenshotBlob, 'screenshot.png');
        }

        const res = await fetch(config.endpoint ?? '/api/feedback', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          throw new Error(res.statusText || 'Failed to submit feedback');
        }

        config.onSubmit?.({
          comment: comment.trim(),
          route,
          componentName: elementContext?.componentName ?? undefined,
          selector: elementContext?.selector ?? undefined,
          metadata: config.metadata,
          screenshot: !!screenshotBlob,
        });

        setStatus('success');
        setErrorMessage(null);
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.'
        );
      }
    },
    [
      comment,
      prompt,
      includeScreenshot,
      config,
      elementContext,
      handleClose,
      onSuccess,
    ]
  );

  const sourceFrame = elementContext?.stack[0] ?? null;
  const sourceLabel = sourceFrame?.fileName
    ? `${sourceFrame.fileName.split('/').pop()}${sourceFrame.lineNumber ? `:${sourceFrame.lineNumber}` : ''}`
    : null;

  if (status === 'success') {
    return (
      <div
        className="flex flex-col items-center gap-3 p-8 text-center"
        data-feedback-success
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <svg
            className="h-6 w-6 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold">Feedback Sent!</p>
        <p className="text-sm text-muted-foreground">
          Thank you for helping us improve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-feedback-form>
      <div className="space-y-4">
        {/* Element context card */}
        {elementContext && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/50">
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-4 h-4 text-muted-foreground shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                  />
                </svg>
                <span className="text-sm font-medium text-foreground truncate">
                  {elementContext.componentName || 'Unknown Component'}
                </span>
              </div>
              {elementContext.selector && (
                <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono shrink-0 max-w-[200px] truncate">
                  {elementContext.selector}
                </code>
              )}
            </div>
            {sourceLabel && (
              <div className="flex items-center gap-2 px-3 py-2 border-t border-border text-xs text-muted-foreground font-mono">
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <span className="truncate">{sourceLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* Comment */}
        <div className="space-y-2">
          <label htmlFor="fb-comment" className="text-sm font-medium">
            Describe the issue
          </label>
          <textarea
            ref={textareaRef}
            id="fb-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={ui.placeholder}
            required
            disabled={status === 'sending'}
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Suggested fix */}
        <div className="space-y-2">
          <label
            htmlFor="fb-prompt"
            className="text-sm font-medium flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
            Suggested fix
            <span className="text-muted-foreground font-normal text-xs">
              (optional)
            </span>
          </label>
          <textarea
            id="fb-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Make the submit button disabled when the form is empty"
            disabled={status === 'sending'}
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Screenshot toggle */}
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
            Include screenshot
          </span>
          <input
            type="checkbox"
            checked={includeScreenshot}
            onChange={(e) => setIncludeScreenshot(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-background accent-primary"
          />
        </label>
      </div>

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <p className="text-sm text-red-500 pt-2">{errorMessage}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={handleClose}
          disabled={status === 'sending'}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          {ui.cancelLabel}
        </button>
        <button
          type="submit"
          disabled={status === 'sending' || !comment.trim()}
          onClick={() => status === 'error' && setErrorMessage(null)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {status === 'sending' && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {status === 'sending' ? 'Sending...' : ui.submitLabel}
        </button>
      </div>
    </form>
  );
}
