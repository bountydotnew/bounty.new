'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/utils/convex';
import { OnboardingDialog } from '@/components/onboarding-flow/onboarding-dialog';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function OnboardingStep2Page() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Note: Convex useQuery doesn't support refetchInterval natively.
  // Convex queries are reactive and will auto-update when data changes.
  const installationsData = useQuery(
    api.functions.githubInstallation.getInstallations
  );

  const installUrlData = useQuery(
    api.functions.githubInstallation.getInstallationUrl,
    {
      state: 'onboarding',
    }
  );

  const completeStep = useMutation(api.functions.onboarding.completeStep);

  const handleCompleteStep = async () => {
    setIsPending(true);
    try {
      await completeStep({ step: 2 });
      router.push('/onboarding/step/3');
    } finally {
      setIsPending(false);
    }
  };

  const hasInstallations = (installationsData?.installations?.length ?? 0) > 0;

  // Derive checking state: if installations exist, we're no longer checking
  const effectiveIsChecking = isChecking && !hasInstallations;

  const handleInstallGitHub = () => {
    if (installUrlData?.url) {
      setIsChecking(true);
      window.open(installUrlData.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <OnboardingDialog
      open
      title="Connect GitHub"
      subtitle="Install the app to your repositories"
      isLoading={isPending}
      actionLabel={hasInstallations ? 'Continue' : 'Install GitHub App'}
      onAction={hasInstallations ? handleCompleteStep : handleInstallGitHub}
      skipLabel={hasInstallations ? undefined : 'Skip'}
      onSkip={hasInstallations ? undefined : handleCompleteStep}
    >
      <div className="w-full">
        {hasInstallations ? (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <span className="text-green-500">✓</span>
            Connected to{' '}
            {installationsData?.installations?.[0]?.accountLogin ||
              'your account'}
          </div>
        ) : effectiveIsChecking ? (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <div className="h-3 w-3 animate-spin rounded-full border border-[#929292] border-t-transparent" />
            Waiting for installation...
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <ExternalLink className="h-3 w-3" />
            Opens in a new tab
          </div>
        )}
      </div>
    </OnboardingDialog>
  );
}
