import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-full space-y-4"
      role="status"
      aria-label={message}
    >
      <Loader2 className="animate-spin h-8 w-8" aria-hidden="true" />
      <span className="sr-only">{message}</span>
    </div>
  );
}