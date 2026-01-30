import { cn } from '@bounty/ui/lib/utils';

interface MiniAwardBalanceProps {
  balance: number;
  bountyAmount: number;
}

export function MiniAwardBalance({ balance, bountyAmount }: MiniAwardBalanceProps) {
  const hasInsufficientBalance = balance < bountyAmount;
  const canPay = balance >= bountyAmount;

  return (
    <div className="contain-content w-full h-[628px] flex flex-col justify-between items-start gap-[25px] px-8 py-6 rounded-[30px] bg-surface-1 border border-border-subtle antialiased">
      {/* Header */}
      <div className="flex flex-col gap-2 w-full">
        <div className="w-[147px] h-[13px] rounded-full shrink-0 bg-text-muted/50" />
        <h3 className="text-foreground text-lg font-medium">Pay with Award Balance</h3>
      </div>

      {/* Balance display */}
      <div className="flex flex-col gap-4 w-full">
        <div className="contain-content w-auto h-[120px] rounded-[5px] self-stretch shrink-0 outline outline-1 outline-border-subtle p-6 flex flex-col justify-center items-center gap-4">
          <div className="text-text-secondary text-sm">Available Balance</div>
          <div className="text-foreground text-4xl font-bold">${balance.toFixed(2)}</div>
          {hasInsufficientBalance && (
            <div className="text-text-muted text-xs text-center">
              Insufficient balance for ${bountyAmount.toFixed(2)} bounty
            </div>
          )}
        </div>

        {/* Amount breakdown */}
        <div className="contain-content w-auto h-[200px] rounded-[5px] self-stretch shrink-0 outline outline-1 outline-border-subtle p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Bounty Amount</span>
            <span className="text-foreground text-sm font-medium">${bountyAmount.toFixed(2)}</span>
          </div>
          {hasInsufficientBalance ? (
            <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
              <span className="text-text-muted text-sm">Shortfall</span>
              <span className="text-text-muted text-sm font-medium">
                ${(bountyAmount - balance).toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
              <span className="text-text-secondary text-sm">Remaining Balance</span>
              <span className="text-foreground text-sm font-medium">
                ${(balance - bountyAmount).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pay button */}
      <div
        className={cn(
          'contain-layout w-full h-[43px] rounded-full shrink-0 flex justify-center items-center gap-4 p-4 transition-colors',
          canPay
            ? 'bg-white cursor-pointer hover:bg-white/90'
            : 'bg-background border border-border-subtle cursor-not-allowed'
        )}
      >
        <div
          className={cn(
            'text-[16px] leading-5 shrink-0 font-semibold size-fit',
            canPay ? 'text-black' : 'text-text-muted'
          )}
        >
          {canPay ? 'Pay' : 'Insufficient Balance'}
        </div>
      </div>
    </div>
  );
}
