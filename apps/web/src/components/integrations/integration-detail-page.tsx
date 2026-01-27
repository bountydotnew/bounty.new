'use client';

import { Loader2 } from 'lucide-react';
import { BackLink } from './back-link';

interface IntegrationDetailPageProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  errorMessage?: string;
  backHref?: string;
  backLabel?: string;
}

export function IntegrationDetailPage({
  children,
  isLoading = false,
  error = null,
  errorMessage = 'Failed to load. Please try again.',
  backHref,
  backLabel,
}: IntegrationDetailPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={backHref} label={backLabel} />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-[#5A5A5A]" />
        </div>
      )}

      {!isLoading && error && (
        <p className="text-sm text-[#5A5A5A]">{errorMessage}</p>
      )}

      {!(isLoading || error) && children}
    </div>
  );
}
