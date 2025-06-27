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
  /**
   * The style of the badge
   */
  style?: "default" | "thin";
}

/**
 * Usage:
 * <BackedByBadge text="Backed by G Combinator" />
 */

export function BackedByBadge({ 
  text, 
  icon = <GCombinator />, 
  className,
  style = "default"
}: BackedByBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 backdrop-blur-xs bg-gradient-to-br from-white/8 to-white/4 border border-white/8 rounded-full px-4 py-1.5 text-sm mb-6",
      style === "thin" && "px-4 py-1.5 text-sm",
      className
    )}>
      {icon}
      {text}
    </div>
  );
} 