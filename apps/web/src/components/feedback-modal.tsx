'use client';

import type React from 'react';
import html2canvas from 'html2canvas-pro';
import { useState } from 'react';
import { useFeedback } from '@/components/feedback-context';
import { Loader2, CheckCircle2, Camera } from 'lucide-react';
import { SparklesIcon } from '@bounty/ui/components/icons/huge/sparkles';
import { FileCodeIcon } from '@bounty/ui/components/icons/huge/file-code';
import { toast } from 'sonner';
import { openFile } from 'react-grab/primitives';
import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@bounty/ui/components/dialog';
import { Label } from '@bounty/ui/components/label';
import { Switch } from '@bounty/ui/components/switch';
import { Textarea } from '@bounty/ui/components/textarea';

/**
 * Modal component that displays the feedback form.
 * Uses react-grab element context for rich component information.
 */
export function FeedbackModal() {
  const { isFeedbackOpen, closeFeedback, elementContext, config } =
    useFeedback();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [comment, setComment] = useState('');
  const [prompt, setPrompt] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);

  const ui = {
    title: config.ui?.title || 'Send Feedback',
    placeholder: config.ui?.placeholder || 'What seems to be the problem?',
    submitLabel: config.ui?.submitLabel || 'Send Feedback',
    cancelLabel: config.ui?.cancelLabel || 'Cancel',
  };

  const handleClose = () => {
    if (status === 'sending') {
      return;
    }
    setStatus('idle');
    setComment('');
    setPrompt('');
    setIncludeScreenshot(true);
    closeFeedback();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      let blob: Blob | null = null;

      if (includeScreenshot) {
        // Compute the highlight rect from the selected element before cloning
        const selectedRect = elementContext?.element
          ? elementContext.element.getBoundingClientRect()
          : null;
        const highlightComponentLabel =
          elementContext?.componentName ||
          elementContext?.selector ||
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
            // Remove dialog and overlay from the clone (never touches real DOM)
            for (const el of clonedDoc.querySelectorAll(
              '[data-slot="dialog-backdrop"], [data-slot="dialog-viewport"]'
            )) {
              el.remove();
            }
            const clonedOverlay = clonedDoc.getElementById(
              'feedback-overlay-layer'
            );
            if (clonedOverlay) {
              clonedOverlay.remove();
            }

            // Apply privacy mask in the clone
            for (const el of clonedDoc.querySelectorAll(
              '[data-privacy="masked"]'
            )) {
              (el as HTMLElement).style.filter = 'blur(10px)';
            }

            // Replace images with placeholders in the clone
            for (const img of clonedDoc.querySelectorAll('img')) {
              const rect = img.getBoundingClientRect();
              const placeholder = clonedDoc.createElement('div');
              placeholder.style.width = `${rect.width}px`;
              placeholder.style.height = `${rect.height}px`;
              placeholder.style.backgroundColor = '#1a1a1a';
              placeholder.style.display = 'inline-block';
              placeholder.style.verticalAlign = 'middle';
              img.parentNode?.replaceChild(placeholder, img);
            }

            // Add element highlight to the clone
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
              label.textContent = highlightComponentLabel;
              clonedDoc.body.appendChild(label);
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
      }

      // Prepare & send data
      const formData = new FormData();
      formData.append('comment', comment);
      formData.append('route', window.location.href);
      formData.append('includeScreenshot', includeScreenshot.toString());
      if (prompt.trim()) {
        formData.append('prompt', prompt);
      }

      if (blob && includeScreenshot) {
        formData.append('screenshot', blob, 'screenshot.png');
      }

      if (config.metadata) {
        formData.append('metadata', JSON.stringify(config.metadata));
      }

      // Send rich element context from react-grab
      if (elementContext) {
        formData.append(
          'element',
          JSON.stringify({
            componentName: elementContext.componentName,
            selector: elementContext.selector,
            htmlPreview: elementContext.htmlPreview,
            stack: elementContext.stack.map((frame) => ({
              functionName: frame.functionName,
              fileName: frame.fileName,
              lineNumber: frame.lineNumber,
              columnNumber: frame.columnNumber,
            })),
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

      setStatus('success');

      config.onFeedbackSubmit?.({
        comment,
        prompt,
        route: window.location.href,
        componentName: elementContext?.componentName || '',
        selector: elementContext?.selector || '',
        includeScreenshot: includeScreenshot.toString(),
      });

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('[Feedback] Error sending feedback:', error);
      setStatus('idle');
      toast.error('Failed to send feedback. Please try again.');
    }
  };

  // Extract source location from the first stack frame
  const sourceFrame = elementContext?.stack[0] ?? null;
  const sourceLabel = sourceFrame?.fileName
    ? `${sourceFrame.fileName.split('/').pop()}${sourceFrame.lineNumber ? `:${sourceFrame.lineNumber}` : ''}`
    : null;

  return (
    <Dialog
      open={isFeedbackOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent showCloseButton={status !== 'sending'}>
        {status === 'success' ? (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Feedback Sent</DialogTitle>
            </DialogHeader>
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-foreground font-semibold text-lg mb-1">
                Feedback Sent!
              </h3>
              <p className="text-muted-foreground text-sm">
                Thank you for helping us improve.
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{ui.title}</DialogTitle>
              <DialogDescription>
                Help us improve by describing what went wrong.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 space-y-4">
              {/* Element context card */}
              {elementContext && (
                <div className="rounded-lg border border-border overflow-hidden">
                  {/* Component name header */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCodeIcon className="w-4 h-4 text-muted-foreground shrink-0" />
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

                  {/* Source file link */}
                  {sourceFrame?.fileName && (
                    <button
                      type="button"
                      onClick={() => {
                        if (sourceFrame.fileName) {
                          openFile(
                            sourceFrame.fileName,
                            sourceFrame.lineNumber ?? undefined
                          );
                        }
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left border-t border-border hover:bg-muted/30 transition-colors group"
                    >
                      <FileCodeIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors font-mono truncate">
                        {sourceLabel}
                      </span>
                      <span className="text-xs text-muted-foreground/60 ml-auto shrink-0">
                        Open in editor
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="feedback-comment">Describe the issue</Label>
                <Textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setComment(e.target.value)
                  }
                  placeholder={ui.placeholder}
                  required
                  disabled={status === 'sending'}
                  style={{ minHeight: '120px', resize: 'none' }}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="feedback-prompt"
                  className="flex items-center gap-1.5"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Suggested fix prompt
                  <span className="text-muted-foreground font-normal text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="feedback-prompt"
                  value={prompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setPrompt(e.target.value)
                  }
                  placeholder="e.g. Make the submit button disabled when the form is empty"
                  disabled={status === 'sending'}
                  style={{ minHeight: '72px', resize: 'none' }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <Label
                  htmlFor="screenshot-toggle"
                  className="flex items-center gap-2 cursor-pointer font-normal text-muted-foreground"
                >
                  <Camera className="w-4 h-4" />
                  Include screenshot
                </Label>
                <Switch
                  id="screenshot-toggle"
                  checked={includeScreenshot}
                  onCheckedChange={(checked) => setIncludeScreenshot(checked)}
                />
              </div>
            </div>

            <DialogFooter variant="bare">
              <DialogClose asChild>
                <Button variant="outline" disabled={status === 'sending'}>
                  {ui.cancelLabel}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={status === 'sending' || !comment.trim()}
              >
                {status === 'sending' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {status === 'sending' ? 'Sending...' : ui.submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
