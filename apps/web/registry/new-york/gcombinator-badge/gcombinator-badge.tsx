import GCombinator from '@/components/icons/g-combinator';
import { cn } from '@bounty/ui/lib/utils';

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
  className,
}: BackedByBadgeProps) {
  return (
    <div
      className={cn(
        'mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-xs',
        className
      )}
    >
      {icon}
      {text}
    </div>
  );
}
