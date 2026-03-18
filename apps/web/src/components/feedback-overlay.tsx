'use client';

import { useRef, useState } from 'react';
import { useMountEffect } from '@bounty/ui';
import { useFeedback } from '@/components/feedback-context';
import { createPortal } from 'react-dom';
import { getElementContext, freeze, unfreeze } from 'react-grab/primitives';
import { getFiberFromHostInstance, getDisplayName, traverseFiber } from 'bippy';

type HoveredInfo = {
  rect: DOMRect;
  componentName: string | null;
  tagName: string;
} | null;

/**
 * Synchronously resolve the nearest React component name for a DOM element.
 */
function getComponentName(element: Element): string | null {
  const fiber = getFiberFromHostInstance(element);
  if (!fiber) {
    return null;
  }
  // Walk up from the host fiber to find the nearest composite (user) component
  let name: string | null = null;
  traverseFiber(
    fiber,
    (f) => {
      const displayName = getDisplayName(f);
      if (displayName && !displayName.startsWith('_')) {
        name = displayName;
        return true; // stop traversal
      }
      return false;
    },
    true
  ); // ascending
  return name;
}

/**
 * Overlay component that handles the "element picker" interaction.
 * Uses react-grab primitives for rich React component context.
 */
export function FeedbackOverlay() {
  const { isSelecting, selectElement, cancelSelection } = useFeedback();
  const [hovered, setHovered] = useState<HoveredInfo>(null);
  const [isResolving, setIsResolving] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Refs to keep callbacks fresh without re-subscribing
  const isSelectingRef = useRef(isSelecting);
  isSelectingRef.current = isSelecting;
  const isResolvingRef = useRef(isResolving);
  isResolvingRef.current = isResolving;
  const selectElementRef = useRef(selectElement);
  selectElementRef.current = selectElement;
  const cancelSelectionRef = useRef(cancelSelection);
  cancelSelectionRef.current = cancelSelection;

  useMountEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelectingRef.current || isResolvingRef.current) {
        return;
      }

      // Temporarily hide highlight so elementFromPoint hits the real target
      if (highlightRef.current) {
        highlightRef.current.style.display = 'none';
      }

      const overlay = document.getElementById('feedback-overlay-layer');
      if (overlay) {
        overlay.style.pointerEvents = 'none';
      }

      const target = document.elementFromPoint(e.clientX, e.clientY);

      if (overlay) {
        overlay.style.pointerEvents = 'auto';
      }
      if (highlightRef.current) {
        highlightRef.current.style.display = '';
      }

      if (
        target &&
        target !== document.body &&
        !target.hasAttribute('data-feedback-ignore')
      ) {
        const rect = target.getBoundingClientRect();
        setHovered({
          rect,
          componentName: getComponentName(target),
          tagName: target.tagName.toLowerCase(),
        });
      } else {
        setHovered(null);
      }
    };

    const handleClick = async (e: MouseEvent) => {
      if (!isSelectingRef.current || isResolvingRef.current) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      // Hide overlay to find real target
      if (highlightRef.current) {
        highlightRef.current.style.display = 'none';
      }
      const overlay = document.getElementById('feedback-overlay-layer');
      if (overlay) {
        overlay.style.pointerEvents = 'none';
      }

      const target = document.elementFromPoint(e.clientX, e.clientY);

      if (overlay) {
        overlay.style.pointerEvents = 'auto';
      }

      if (!target) {
        return;
      }

      setIsResolving(true);

      try {
        // Freeze the page while we gather context
        freeze();
        const context = await getElementContext(target);
        unfreeze();

        selectElementRef.current(context);
      } catch {
        unfreeze();
      } finally {
        setIsResolving(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelSelectionRef.current();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Clear hovered state when selection mode is turned off
  const prevIsSelectingRef = useRef(isSelecting);
  if (prevIsSelectingRef.current !== isSelecting) {
    prevIsSelectingRef.current = isSelecting;
    if (!isSelecting) {
      setHovered(null);
    }
  }

  if (!isSelecting) {
    return null;
  }

  return createPortal(
    <div
      id="feedback-overlay-layer"
      className="fixed inset-0 cursor-crosshair bg-black/10"
      style={{ zIndex: 9998 }}
    >
      {/* Hint banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background text-foreground px-4 py-2 rounded-full font-medium text-sm shadow-lg border border-border animate-in fade-in slide-in-from-top-4">
        {isResolving
          ? 'Resolving component...'
          : 'Click an element to select it \u00b7 Press Esc to cancel'}
      </div>

      {/* Highlight box */}
      {hovered && (
        <div
          ref={highlightRef}
          className="fixed pointer-events-none transition-all duration-75 ease-out rounded-sm border-2 border-blue-500 bg-blue-500/10"
          style={{
            top: hovered.rect.top,
            left: hovered.rect.left,
            width: hovered.rect.width,
            height: hovered.rect.height,
          }}
        >
          {/* Label tag */}
          <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-sm whitespace-nowrap flex items-center gap-1">
            {hovered.componentName ? (
              <>
                <span className="font-medium">{hovered.componentName}</span>
                <span className="opacity-60 font-mono">{hovered.tagName}</span>
              </>
            ) : (
              <span className="font-mono">{hovered.tagName}</span>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
