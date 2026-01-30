import { cn } from '@bounty/ui/lib/utils';

interface PaymentMethodCardProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  miniComponent?: React.ReactNode;
  overflowHidden?: boolean;
}

export function PaymentMethodCard({
  icon,
  label,
  sublabel,
  selected,
  disabled = false,
  onClick,
  miniComponent,
  overflowHidden = false,
}: PaymentMethodCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 shrink-0">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'flex flex-col justify-center items-center shrink-0',
            'w-[131px] h-[95px] rounded-[17px]',
            'transition-all duration-200',
            overflowHidden && 'overflow-hidden',
            selected
              ? 'bg-background border border-solid border-background/40 outline outline-text-muted outline-offset-2'
              : 'bg-surface-1 border border-solid border-border-subtle',
            disabled && 'opacity-100 cursor-not-allowed',
            !(disabled || selected ) && 'hover:bg-surface-2'
          )}
        >
          <div className="flex items-center justify-center shrink-0 relative">{icon}</div>
        </button>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span
            className={cn(
              'text-[14px] leading-[18px] text-center text-foreground font-medium',
              disabled && 'text-text-muted'
            )}
          >
            {label}
          </span>
          {sublabel && (
            <span
              className={cn(
                'text-[12px] leading-[16px] text-center',
                disabled ? 'text-text-muted' : 'text-text-secondary'
              )}
            >
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {/* Mini component shown when selected */}
      {selected && miniComponent && (
        <div className="w-full relative" style={{ height: '314px', overflow: 'hidden' }}>
          <div style={{ transform: 'translateY(-314px)', width: '100%' }}>
            {miniComponent}
          </div>
        </div>
      )}
    </div>
  );
}
