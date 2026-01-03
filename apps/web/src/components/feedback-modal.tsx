'use client';

import type React from 'react';
import html2canvas from 'html2canvas-pro';
import { useState } from 'react';
import { useFeedback } from '@/components/feedback-context';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Modal component that displays the feedback form.
 * Handles screenshot generation and data submission.
 */
export function FeedbackModal() {
  const { isFeedbackOpen, closeFeedback, selectedElement, config } =
    useFeedback();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [comment, setComment] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);

  const ui = {
    title: config.ui?.title || 'Send Feedback',
    placeholder: config.ui?.placeholder || 'What seems to be the problem?',
    submitLabel: config.ui?.submitLabel || 'Send Feedback',
    cancelLabel: config.ui?.cancelLabel || 'Cancel',
    zIndex: config.ui?.zIndex || 9999,
    primaryColor: config.ui?.colors?.primary || '#E66700',
  };

  if (!isFeedbackOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      let blob: Blob | null = null;

      // 1. Capture Screenshot (only if user wants it)
      if (includeScreenshot) {
        // Hide the modal backdrop, content, and overlay temporarily so they don't block the screenshot
        const modalBackdrop = document.getElementById(
          'feedback-modal-backdrop'
        );
        if (modalBackdrop) {
          modalBackdrop.style.display = 'none';
        }
        const modalElement = document.getElementById('feedback-modal-content');
        if (modalElement) {
          modalElement.style.opacity = '0';
        }
        const overlayElement = document.getElementById(
          'feedback-overlay-layer'
        );
        if (overlayElement) {
          overlayElement.style.display = 'none';
        }

        // Apply privacy mask
        const sensitiveElements = document.querySelectorAll(
          '[data-privacy="masked"]'
        );
        for (const el of sensitiveElements) {
          (el as HTMLElement).style.filter = 'blur(10px)';
        }

        // Capture only the viewport - replace all images with solid color placeholders
        const canvas = await html2canvas(document.body, {
          logging: false, // Suppress console errors
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          onclone: (clonedDoc) => {
            // Replace all images with solid color divs
            const images = clonedDoc.querySelectorAll('img');
            for (const img of images) {
              const rect = img.getBoundingClientRect();
              const placeholder = clonedDoc.createElement('div');
              placeholder.style.width = `${rect.width}px`;
              placeholder.style.height = `${rect.height}px`;
              placeholder.style.backgroundColor = '#1a1a1a'; // Dark gray placeholder
              placeholder.style.display = 'inline-block';
              placeholder.style.verticalAlign = 'middle';
              img.parentNode?.replaceChild(placeholder, img);
            }
          },
        });
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/png');
        });

        // Restore UI
        if (modalBackdrop) {
          modalBackdrop.style.display = '';
        }
        if (modalElement) {
          modalElement.style.opacity = '1';
        }
        if (overlayElement) {
          overlayElement.style.display = '';
        }
        for (const el of sensitiveElements) {
          (el as HTMLElement).style.filter = 'none';
        }
      }

      // 2. Prepare Data
      const formData = new FormData();
      formData.append('comment', comment);
      formData.append('route', window.location.href);
      formData.append('includeScreenshot', includeScreenshot.toString());

      if (blob && includeScreenshot) {
        formData.append('screenshot', blob, 'screenshot.png');
      }

      // Append metadata from config if available
      if (config.metadata) {
        formData.append('metadata', JSON.stringify(config.metadata));
      }

      if (selectedElement) {
        formData.append(
          'element',
          JSON.stringify({
            tagName: selectedElement.tagName,
            id: selectedElement.id,
            className: selectedElement.className,
          })
        );
      }

      const response = await fetch(config.apiEndpoint || '/api/feedback', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      console.log('[Feedback] Feedback submitted successfully');
      setStatus('success');

      // Trigger success callback
      config.onFeedbackSubmit?.({
        comment,
        route: window.location.href,
        selectedElement: selectedElement?.toString() || '',
        includeScreenshot: includeScreenshot.toString(),
      });

      setTimeout(() => {
        setStatus('idle');
        setComment('');
        setIncludeScreenshot(true);
        closeFeedback();
      }, 2000);
    } catch (error) {
      console.error('[Feedback] Error sending feedback:', error);
      // Reset status so user can try again
      setStatus('idle');
      toast.error('Failed to send feedback. Please try again.');
    }
  };

  return (
    <div
      id="feedback-modal-backdrop"
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
      style={{ zIndex: ui.zIndex }}
    >
      <div
        id="feedback-modal-content"
        className="w-full max-w-md bg-[#191919] border border-[#232323] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 transition-opacity"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#232323]">
          <h2 className="text-white font-medium text-lg">{ui.title}</h2>
          <button
            type="button"
            onClick={closeFeedback}
            className="text-[#929292] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">
              Feedback Sent!
            </h3>
            <p className="text-[#929292] text-sm">
              Thank you for helping us improve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {selectedElement && (
              <div className="p-3 bg-[#141414] rounded-lg border border-[#232323]">
                <div className="text-[#929292] text-xs uppercase tracking-wider font-semibold mb-1">
                  Selected Element
                </div>
                <div className="text-white font-mono text-sm truncate">
                  {selectedElement.tagName.toLowerCase()}
                  {selectedElement.id ? `#${selectedElement.id}` : ''}
                  {selectedElement.className
                    ? `.${selectedElement.className.split(' ').join('.')}`
                    : ''}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="comment"
                className="text-[#929292] text-sm font-medium"
              >
                Describe the issue
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={ui.placeholder}
                className="w-full h-32 bg-[#141414] border border-[#232323] rounded-lg p-3 text-white placeholder:text-[#525252] focus:outline-none focus:ring-1 resize-none"
                style={{
                  borderColor:
                    status === 'sending' ? ui.primaryColor : undefined,
                }}
                required
              />
            </div>

            {/* Screenshot toggle option */}
            <div className="flex items-center gap-3 p-3 bg-[#141414] rounded-lg border border-[#232323]">
              <input
                type="checkbox"
                id="include-screenshot"
                checked={includeScreenshot}
                onChange={(e) => setIncludeScreenshot(e.target.checked)}
                className="w-4 h-4 rounded border-[#232323] bg-[#191919] text-[#E66700] focus:ring-[#E66700] focus:ring-offset-0 cursor-pointer"
                style={{ accentColor: ui.primaryColor as string }}
              />
              <label
                htmlFor="include-screenshot"
                className="text-[#929292] text-sm font-medium cursor-pointer flex-1"
              >
                Include screenshot
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeFeedback}
                className="px-4 py-2 text-[#929292] hover:text-white text-sm font-medium transition-colors"
              >
                {ui.cancelLabel}
              </button>
              <button
                type="submit"
                disabled={status === 'sending' || !comment.trim()}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: ui.primaryColor }}
              >
                {status === 'sending' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {status === 'sending'
                  ? 'Sending...'
                  : (ui.submitLabel as string)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
