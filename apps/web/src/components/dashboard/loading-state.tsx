import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div
      aria-label={message}
      className="flex min-h-full flex-col items-center justify-center space-y-4"
      role="status"
    >
      <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin" />
      <span className="sr-only">{message}</span>
    </div>
  );
}
