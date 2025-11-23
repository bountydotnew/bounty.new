"use client"

import { useEffect, useState, useRef } from "react"
import { useFeedback } from "@/components/feedback-context"
import { createPortal } from "react-dom"

/**
 * Overlay component that handles the "element picker" interaction.
 * Renders a portal directly to the body to ensure it floats above everything.
 */
export function FeedbackOverlay() {
  const { isSelecting, selectElement, cancelSelection, config } = useFeedback()
  const [hoveredElement, setHoveredElement] = useState<{ rect: DOMRect; tagName: string } | null>(null)

  // Ref to track if we're currently processing an event to avoid loops
  const isProcessingRef = useRef(false)

  const zIndex = config.ui?.zIndex ? config.ui.zIndex - 1 : 9999
  const primaryColor = config.ui?.colors?.primary || "#E66700"

  useEffect(() => {
    if (!isSelecting) {
      setHoveredElement(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true

      // Hide the overlay temporarily to find the element underneath
      const overlay = document.getElementById("feedback-overlay-layer")
      if (overlay) overlay.style.pointerEvents = "none"

      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement

      if (overlay) overlay.style.pointerEvents = "auto"

      if (element && element !== document.body && !element.hasAttribute("data-feedback-ignore")) {
        const rect = element.getBoundingClientRect()
        setHoveredElement({
          rect,
          tagName: element.tagName.toLowerCase(),
        })
      } else {
        setHoveredElement(null)
      }

      isProcessingRef.current = false
    }

    const handleClick = (e: MouseEvent) => {
      if (!isSelecting) return
      e.preventDefault()
      e.stopPropagation()

      // Similar logic to find element under click
      const overlay = document.getElementById("feedback-overlay-layer")
      if (overlay) overlay.style.pointerEvents = "none"
      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
      if (overlay) overlay.style.pointerEvents = "auto"

      if (element) {
        selectElement(element)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelSelection()
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick, true)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick, true)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isSelecting, selectElement, cancelSelection, config])

  if (!isSelecting) return null

  return createPortal(
    <div id="feedback-overlay-layer" className="fixed inset-0 cursor-crosshair bg-black/10" style={{ zIndex }}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4">
        Hover to select an element • Press Esc to cancel
      </div>

      {hoveredElement && (
        <div
          className="absolute border-2 pointer-events-none transition-all duration-75 ease-out rounded-sm"
          style={{
            top: hoveredElement.rect.top + window.scrollY,
            left: hoveredElement.rect.left + window.scrollX,
            width: hoveredElement.rect.width,
            height: hoveredElement.rect.height,
            borderColor: primaryColor,
            backgroundColor: `${primaryColor}1A`, // 10% opacity hex
          }}
        >
          <div
            className="absolute -top-6 left-0 text-white text-xs px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {hoveredElement.tagName}
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
