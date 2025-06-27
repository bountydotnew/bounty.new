import { cn } from "@/lib/utils";
import { GCombinator } from "@/components/icons/g-combinator";

interface BackedByBadgeProps {
  /**
   * The text to display in the badge
   */
  text: string;
  /**
   * Optional icon component to display. Defaults to GCombinator icon.
   */
  icon?: React.ReactNode;
  /**
   * Additional CSS classes to apply to the badge
   */
  className?: string;
}

/**
 * Usage:
 * <BackedByBadge text="Backed by G Combinator" />
 */

export function BackedByBadge({ 
  text, 
  icon = <GCombinator />, 
  className 
}: BackedByBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/20 rounded-full px-4 py-1.5 mb-2",
      className
    )}>
      {icon}
      {text}
    </div>
  );
} 