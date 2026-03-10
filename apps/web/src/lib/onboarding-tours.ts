import type { Tour } from '@bounty/ui/components/tour';

/**
 * Build the onboarding tour with dynamic org slug for multi-page navigation.
 *
 * Steps:
 * 1. Connect Stripe payments (settings/payments?tab=settings)
 * 2. Install GitHub integration (integrations page)
 * 3. Create a bounty (bounties page — optional)
 */
export function buildOnboardingTour(orgSlug: string): Tour {
  return {
    id: 'onboarding',
    steps: [
      {
        id: 'stripe-connect',
        title: 'Connect Stripe',
        content:
          'Set up Stripe to receive payments for your bounties. This lets contributors get paid when they complete work.',
        side: 'bottom',
        sideOffset: 12,
        align: 'start',
        nextRoute: `/${orgSlug}/integrations`,
        nextLabel: 'Next',
      },
      {
        id: 'github-integration',
        title: 'Install GitHub',
        content:
          'Connect your GitHub account to create bounties from issues and let contributors submit pull requests.',
        side: 'bottom',
        sideOffset: 12,
        align: 'start',
        previousRoute: `/${orgSlug}/settings/payments?tab=settings`,
        nextRoute: '/bounties',
        nextLabel: 'Next',
      },
      {
        id: 'create-bounty',
        title: 'Create a Bounty',
        content:
          'Ready to go! Create your first bounty to start getting contributions. This step is optional — you can always do it later.',
        side: 'bottom',
        sideOffset: 12,
        align: 'start',
        previousRoute: `/${orgSlug}/integrations`,
        nextLabel: 'Finish',
      },
    ],
  };
}
