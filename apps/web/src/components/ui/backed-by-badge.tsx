import { cn } from "@/lib/utils";
import { GCombinator } from "@/components/icons/g-combinator";

/**
 * Usage:
 * <BackedByBadge />
 */

export function BackedByBadge() {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 backdrop-blur-xs bg-gradient-to-br from-white/8 to-white/4 border border-white/8 rounded-full px-4 py-1.5 text-sm mb-6"
    )}>
      Backed by <GCombinator /> Combinator
    </div>
  );
} 