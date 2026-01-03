import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  dismissible?: boolean;
}

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  className,
  dismissible = true,
}: ErrorBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-red-500/50 hover:bg-red-500/20"
          >
            Try Again
          </Button>
        )}
        {dismissible && (
          <Button
            size="sm"
            variant="link"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-red-500/20"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </div>
  );
}
