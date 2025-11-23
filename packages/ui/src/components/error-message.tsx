import { AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface ErrorMessageProps {
  message?: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "mt-1 flex items-start gap-1.5 text-red-500 text-sm",
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
