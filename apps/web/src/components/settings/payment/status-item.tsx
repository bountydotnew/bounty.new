import { Badge } from '@bounty/ui/components/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';

interface StatusItemProps {
  label: string;
  value: boolean | string;
  variant?: 'badge' | 'icon';
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export function StatusItem({
  label,
  value,
  variant = 'badge',
  badgeVariant,
}: StatusItemProps) {
  const isActive = typeof value === 'boolean' ? value : value === 'active';
  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;

  if (variant === 'icon') {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <span className={cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
            {displayValue}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge
        variant={
          badgeVariant ||
          (isActive
            ? 'default'
            : typeof value === 'string' && value === 'pending'
              ? 'outline'
              : 'secondary')
        }
      >
        {displayValue}
      </Badge>
    </div>
  );
}
