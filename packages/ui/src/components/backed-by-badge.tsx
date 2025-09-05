import GCombinator from '@/components/icons/g-combinator';
import { cn } from '@bounty/ui/lib/utils';

/**
 * Usage:
 * <BackedByBadge />
 */

export function BackedByBadge() {
  return (
    <div
      className={cn(
        'mb-6 inline-flex items-center gap-1 rounded-full rounded-radius border border-white/8 bg-gradient-to-br from-white/8 to-white/4 px-4 py-1.5 text-xs backdrop-blur-xs'
      )}
    >
      Backed by
      <span className="ml-0.5 flex items-center gap-0.75 text-xs">
        <GCombinator />
        <span className="text-xs">Combinator</span>
      </span>
    </div>
  );
}
