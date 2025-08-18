import { cn } from "@/lib/utils";
import Bounty from "../icons/bounty";

interface PaymentButtonProps {
  username: string;
  apiKey?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  className?: string;
}

export function PaymentButton({
  username,
  apiKey,
  size = "md",
  variant = "default",
  className,
}: PaymentButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    default: "bg-white text-black border border-gray-200 hover:bg-gray-50",
    outline:
      "bg-transparent text-white border border-white hover:bg-white hover:text-black",
  };

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_APP_URL}/pay/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      data-bounty-payment-button
      data-username={username}
      data-api-key={apiKey}
    >
      {/* Bounty Logo */}
      <Bounty className="w-4 h-4" />
      Sponsor this PR
    </a>
  );
}

// Standalone embeddable version for external use
export function EmbeddablePaymentButton({
  username,
  apiKey,
  size = "md",
}: Pick<PaymentButtonProps, "username" | "apiKey" | "size">) {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: "inline-block",
      }}
    >
      <PaymentButton
        username={username}
        apiKey={apiKey}
        size={size}
        className="no-underline"
      />
    </div>
  );
}
