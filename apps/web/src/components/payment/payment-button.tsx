import { cn } from '@bounty/ui/lib/utils';
import type { PaymentButtonProps } from '@/types/billing-components';
import Bounty from '../icons/bounty';

export function PaymentButton({
  username,
  apiKey,
  size = 'md',
  variant = 'default',
  className,
}: PaymentButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    default: 'bg-white text-black border border-gray-200 hover:bg-gray-50',
    outline:
      'bg-transparent text-white border border-white hover:bg-white hover:text-black',
  };

  return (
    <a
      className={cn(
        'inline-flex items-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      data-api-key={apiKey}
      data-bounty-payment-button
      data-username={username}
      href={`/pay/${username}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      {/* Bounty Logo */}
      <Bounty className="h-4 w-4" />
      Sponsor this PR
    </a>
  );
}

// Standalone embeddable version for external use
function _EmbeddablePaymentButton({
  username,
  apiKey,
  size = 'md',
}: Pick<PaymentButtonProps, 'username' | 'apiKey' | 'size'>) {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'inline-block',
      }}
    >
      <PaymentButton
        apiKey={apiKey}
        className="no-underline"
        size={size}
        username={username}
      />
    </div>
  );
}
