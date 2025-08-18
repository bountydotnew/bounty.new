import { Check } from "lucide-react";

export function Badge() {
  return (
    <div
      className="flex rotate-45 items-center justify-center rounded bg-[#C44F15] p-[3.2px] shadow-badge-custom"
      aria-label="Verified badge"
    >
      <Check className="h-[9.6px] w-[9.6px] -rotate-45 text-[#F5F5F5]" />
    </div>
  );
}
