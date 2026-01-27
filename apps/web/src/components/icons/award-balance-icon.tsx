import { cn } from '@bounty/ui/lib/utils';

export function AwardBalanceIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-[131px] h-[95px] shrink-0 overflow-hidden", className)}>
      <div
        className="absolute top-0 left-0 w-[107px] h-[67px] bg-cover bg-center"
        style={{
          backgroundImage: 'url(/bounty-card.png)',
          transform: 'translate(65.5px, 14px)',
        }}
      />
    </div>
  );
}
