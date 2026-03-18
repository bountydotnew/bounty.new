import type { Tour } from '@bounty/ui/components/tour';

/**
 * Build all onboarding tours.
 *
 * Each Getting Started checklist item can trigger its own tour:
 *
 * 1. connect-tools   → integrations page, showcasing integrations grid then GitHub
 * 2. setup-payouts   → settings/payments, ending at Stripe connect button
 * 3. create-bounty   → dashboard, highlights the task input form
 * 4. invite-member   → settings/members, highlights the members section
 */
export function buildOnboardingTours(): Tour[] {
  return [
    {
      id: 'claim-username',
      steps: [
        {
          id: 'username-input',
          title: 'Claim your username',
          content:
            'This is your username on bounty.new. Edit it to something you like, or keep the one we picked for you.',
          side: 'bottom',
          sideOffset: 12,
          align: 'start',
          nextLabel: 'Next',
        },
        {
          id: 'username-save',
          title: 'Save your username',
          content:
            'Happy with your username? Hit save to claim it. You can always change it later in settings.',
          side: 'bottom',
          sideOffset: 12,
          align: 'end',
          nextLabel: 'Got it',
        },
      ],
    },
    {
      id: 'connect-tools',
      steps: [
        {
          id: 'integrations-grid',
          title: 'Your Integrations',
          content:
            'This is where you manage all your integrations. Connect GitHub, Linear, and more to supercharge your bounty workflow.',
          side: 'bottom',
          sideOffset: 12,
          align: 'start',
          nextLabel: 'Next',
        },
        {
          id: 'github-integration',
          title: 'Install GitHub',
          content:
            'Connect your GitHub account to create bounties directly from issues and let contributors submit pull requests.',
          side: 'bottom',
          sideOffset: 12,
          align: 'start',
          nextLabel: 'Got it',
        },
      ],
    },
    {
      id: 'setup-payouts',
      steps: [
        {
          id: 'stripe-connect',
          title: 'Connect Stripe',
          content:
            'Set up Stripe to receive payments for your bounties. Click "Connect with Stripe" to get started.',
          side: 'bottom',
          sideOffset: 12,
          align: 'start',
          nextLabel: 'Got it',
        },
      ],
    },
    {
      id: 'create-bounty',
      steps: [
        {
          id: 'create-bounty-input',
          title: 'Create your first bounty',
          content:
            'Use this form to create a new bounty. Add a title, description, and reward to get started.',
          side: 'bottom',
          sideOffset: 12,
          align: 'center',
          nextLabel: 'Got it',
        },
      ],
    },
    {
      id: 'invite-member',
      steps: [
        {
          id: 'members-settings',
          title: 'Invite team members',
          content:
            'Add members to your organization to collaborate on bounties together.',
          side: 'bottom',
          sideOffset: 12,
          align: 'start',
          nextLabel: 'Got it',
        },
      ],
    },
  ];
}
