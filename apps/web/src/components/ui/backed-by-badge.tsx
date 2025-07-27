import { cn } from "@/lib/utils";
import GCombinator from "@/components/icons/g-combinator";

/**
 * Usage:
 * <BackedByBadge />
 */

export function BackedByBadge() {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 backdrop-blur-xs bg-gradient-to-br from-white/8 to-white/4 border border-white/8 rounded-full px-4 py-1.5 mb-6 text-xs rounded-radius"
    )}>
      Backed by

      <span className="flex items-center gap-0.75 ml-0.5 text-xs">
        <GCombinator />
        <span className="text-xs">Combinator</span>
      </span>
    </div>
  );
} 