'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getElementContext, freeze, unfreeze } from 'react-grab/primitives';
import { getFiberFromHostInstance, getDisplayName, traverseFiber } from 'bippy';
import { useFeedback } from './context';

type HoveredInfo = {
  rect: DOMRect;
  componentName: string | null;
  tagName: string;
} | null;

function getComponentName(element: Element): string | null {
  const fiber = getFiberFromHostInstance(element);
  if (!fiber) {
    return null;
  }
  let name: string | null = null;
  traverseFiber(
    fiber,
    (f) => {
      const displayName = getDisplayName(f);
      if (displayName && !displayName.startsWith('_')) {
        name = displayName;
        return true;
      }
      return false;
    },
    true
  );
  return name;
}

export function FeedbackOverlay() {
  const { isSelecting, selectElement, cancelSelection, config } = useFeedback();
  const overlayZIndex = config.ui?.zIndex ? config.ui.zIndex - 2 : 9998;
  const [hovered, setHovered] = useState<HoveredInfo>(null);
  const [isResolving, setIsResolving] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isSelecting) {
      setHovered(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isResolving) {
        return;
      }

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
        setHovered({
          rect: target.getBoundingClientRect(),
          componentName: getComponentName(target),
          tagName: target.tagName.toLowerCase(),
        });
      } else {
        setHovered(null);
      }
    };

    const handleClick = async (e: MouseEvent) => {
      if (!isSelecting || isResolving) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

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
      cancelledRef.current = false;
      try {
        freeze();
        const context = await getElementContext(target);
        if (cancelledRef.current) {
          unfreeze();
          return;
        }
        unfreeze();
        selectElement(context);
      } catch (err) {
        unfreeze();
        if (!cancelledRef.current) {
          console.error('[feedback] Failed to resolve element context:', err);
          cancelSelection();
        }
      } finally {
        setIsResolving(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isResolving) {
          cancelledRef.current = true;
          unfreeze();
        }
        cancelSelection();
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
  }, [isSelecting, isResolving, selectElement, cancelSelection]);

  if (!isSelecting) {
    return null;
  }

  return createPortal(
    <div
      id="feedback-overlay-layer"
      className="fixed inset-0 cursor-crosshair bg-black/10"
      style={{ zIndex: overlayZIndex }}
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background text-foreground px-4 py-2 rounded-full font-medium text-sm shadow-lg border border-border animate-in fade-in slide-in-from-top-4">
        {isResolving
          ? 'Resolving component...'
          : 'Click an element to select it · Press Esc to cancel'}
      </div>

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
