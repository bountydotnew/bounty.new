import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';

interface RequirementsListProps {
  requirements: string[];
  variant?: 'default' | 'error';
  title?: string;
  emptyMessage?: string;
}

export function RequirementsList({
  requirements,
  variant = 'default',
  title,
  emptyMessage = 'No requirements',
}: RequirementsListProps) {
  if (!requirements || requirements.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && (
        <h4 className={cn('text-sm font-medium', variant === 'error' && 'text-destructive')}>
          {title}
        </h4>
      )}
      <ul className="space-y-2">
        {requirements.map((requirement, index) => (
          <li
            key={index}
            className={cn(
              'flex items-start gap-2 text-sm',
              variant === 'error' ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{requirement}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
