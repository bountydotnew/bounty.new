import { Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Loader2 } from 'lucide-react';

export function AccountBalance() {
  const { data: balanceResponse, isLoading } = useQuery(
    trpc.connect.getAccountBalance.queryOptions()
  );

  const balance = balanceResponse?.data;
  const total = balance?.total || 0;
  const available = balance?.available || 0;
  const pending = balance?.pending || 0;

  // Don't render if balance is zero
  if (total === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Balance</p>
              {isLoading ? (
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold">${Number(total).toFixed(2)}</p>
              )}
            </div>
          </div>
        </div>

        {!isLoading && total > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Available</p>
              <p className="text-sm font-semibold">${Number(available).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-sm font-semibold">${Number(pending).toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
