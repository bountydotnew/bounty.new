import { Check } from 'lucide-react';

export function Badge() {
  return (
    <div
      aria-label="Verified badge"
      className="flex rotate-45 items-center justify-center rounded bg-[#C44F15] p-[3.2px] shadow-badge-custom"
    >
      <Check className="-rotate-45 h-[9.6px] w-[9.6px] text-[#F5F5F5]" />
    </div>
  );
}
