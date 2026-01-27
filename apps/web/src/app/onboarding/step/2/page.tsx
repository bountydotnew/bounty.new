'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpcClient } from '@/utils/trpc';
import { OnboardingDialog } from '@/components/onboarding-flow/onboarding-dialog';
import { ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function OnboardingStep2Page() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const { data: installationsData } = useQuery({
    queryKey: ['githubInstallation.getInstallations'],
    queryFn: () => trpcClient.githubInstallation.getInstallations.query(),
    refetchInterval: isChecking ? 2000 : false,
  });

  const { data: installUrlData } = useQuery({
    queryKey: ['githubInstallation.getInstallationUrl'],
    queryFn: () => trpcClient.githubInstallation.getInstallationUrl.query({ state: 'onboarding' }),
  });

  const completeStepMutation = useMutation({
    mutationFn: () => trpcClient.onboarding.completeStep.mutate({ step: 2 }),
    onSuccess: () => {
      router.push('/onboarding/step/3');
    },
  });

  const hasInstallations = (installationsData?.installations?.length ?? 0) > 0;

  useEffect(() => {
    if (hasInstallations) {
      setIsChecking(false);
    }
  }, [hasInstallations]);

  const handleInstallGitHub = () => {
    if (installUrlData?.url) {
      setIsChecking(true);
      window.open(installUrlData.url, '_blank');
    }
  };

  return (
    <OnboardingDialog
      open
      title="Connect GitHub"
      subtitle="Install the app to your repositories"
      isLoading={completeStepMutation.isPending}
      actionLabel={hasInstallations ? 'Continue' : 'Install GitHub App'}
      onAction={hasInstallations ? () => completeStepMutation.mutate() : handleInstallGitHub}
      skipLabel={hasInstallations ? undefined : 'Skip'}
      onSkip={hasInstallations ? undefined : () => completeStepMutation.mutate()}
    >
      <div className="w-full">
        {hasInstallations ? (
          <div className="flex items-center gap-2 text-sm text-[#929292]">
            <span className="text-green-500">✓</span>
            Connected to {installationsData?.installations?.[0]?.accountLogin || 'your account'}
          </div>
        ) : isChecking ? (
          <div className="flex items-center gap-2 text-sm text-[#929292]">
            <div className="h-3 w-3 animate-spin rounded-full border border-[#929292] border-t-transparent" />
            Waiting for installation...
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[#929292]">
            <ExternalLink className="h-3 w-3" />
            Opens in a new tab
          </div>
        )}
      </div>
    </OnboardingDialog>
  );
}
