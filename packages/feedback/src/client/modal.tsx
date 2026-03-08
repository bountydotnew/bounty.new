'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from 'react';
import { useFeedback } from './context';

export function FeedbackModal() {
  const { isOpen, close, config } = useFeedback();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [comment, setComment] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ui = {
    title: config.ui?.title ?? 'Send Feedback',
    description: config.ui?.description ?? 'Help us improve by sharing what went wrong.',
    placeholder: config.ui?.placeholder ?? 'Describe the issue...',
    submitLabel: config.ui?.submitLabel ?? 'Send Feedback',
    cancelLabel: config.ui?.cancelLabel ?? 'Cancel',
    zIndex: config.ui?.zIndex ?? 10000,
  };

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (status === 'sending') return;
    setStatus('idle');
    setComment('');
    setIncludeScreenshot(true);
    close();
  }, [status, close]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!comment.trim()) return;
      setStatus('sending');

      try {
        let screenshotBlob: Blob | null = null;
        if (includeScreenshot) {
          try {
            const html2canvas = (await import('html2canvas-pro')).default;
            dialogRef.current?.close();
            await new Promise((r) => setTimeout(r, 100));
            const canvas = await html2canvas(document.body, {
              logging: false,
              width: window.innerWidth,
              height: window.innerHeight,
              scrollX: -window.scrollX,
              scrollY: -window.scrollY,
              windowWidth: window.innerWidth,
              windowHeight: window.innerHeight,
            });
            dialogRef.current?.showModal();
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

        const formData = new FormData();
        formData.append('comment', comment.trim());
        formData.append('route', window.location.href);
        formData.append(
          'userAgent',
          navigator.userAgent
        );
        if (config.metadata) {
          formData.append('metadata', JSON.stringify(config.metadata));
        }
        if (screenshotBlob) {
          formData.append('screenshot', screenshotBlob, 'screenshot.png');
        }

        const res = await fetch(config.endpoint ?? '/api/feedback', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Failed');

        config.onSubmit?.({
          comment: comment.trim(),
          route: window.location.href,
          metadata: config.metadata,
          screenshot: !!screenshotBlob,
        });

        setStatus('success');
        setTimeout(handleClose, 1500);
      } catch {
        setStatus('idle');
      }
    },
    [comment, includeScreenshot, config, handleClose]
  );

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      style={{ zIndex: ui.zIndex }}
      onClose={handleClose}
      className="fixed inset-0 m-auto w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-0 text-white shadow-2xl backdrop:bg-black/50"
    >
      {status === 'success' ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold">Thank you!</p>
          <p className="text-sm text-neutral-400">Your feedback has been sent.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="border-b border-neutral-800 px-6 py-4">
            <h2 className="text-lg font-semibold">{ui.title}</h2>
            <p className="mt-1 text-sm text-neutral-400">{ui.description}</p>
          </div>

          <div className="space-y-4 px-6 py-4">
            <textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={ui.placeholder}
              required
              disabled={status === 'sending'}
              rows={4}
              className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none disabled:opacity-50"
            />

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-800 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-neutral-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Include screenshot
              </span>
              <input
                type="checkbox"
                checked={includeScreenshot}
                onChange={(e) => setIncludeScreenshot(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 accent-blue-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-800 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={status === 'sending'}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {ui.cancelLabel}
            </button>
            <button
              type="submit"
              disabled={status === 'sending' || !comment.trim()}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
            >
              {status === 'sending' && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {status === 'sending' ? 'Sending...' : ui.submitLabel}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
