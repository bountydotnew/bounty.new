'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@bounty/ui/components/select';
import { useMutation } from '@tanstack/react-query';
import { trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';
import { useState } from 'react';

/**
 * Countries supported by Stripe Connect Express accounts.
 * ISO 3166-1 alpha-2 codes.
 * https://docs.stripe.com/connect/express-accounts#supported-countries
 */
const STRIPE_CONNECT_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GI', name: 'Gibraltar' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TH', name: 'Thailand' },
  { code: 'AE', name: 'United Arab Emirates' },
] as const;

interface ConnectOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If true, the account already exists — skip the country step. */
  hasConnectAccount?: boolean;
  bountyAmount?: number;
  currency?: string;
}

export function ConnectOnboardingModal({
  open,
  onOpenChange,
  hasConnectAccount = false,
  bountyAmount,
  currency = 'USD',
}: ConnectOnboardingModalProps) {
  const [country, setCountry] = useState<string>('');

  const createAccountLink = useMutation({
    mutationFn: async (selectedCountry?: string) => {
      return await trpcClient.connect.createConnectAccountLink.mutate({
        country: selectedCountry,
      });
    },
    onSuccess: (result) => {
      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to start onboarding: ${error.message}`);
    },
  });

  const handleContinue = () => {
    if (hasConnectAccount) {
      // Account already exists, no country needed — just get an onboarding link
      createAccountLink.mutate(undefined);
    } else {
      createAccountLink.mutate(country);
    }
  };

  const handleLater = () => {
    onOpenChange(false);
  };

  const needsCountry = !hasConnectAccount;
  const canContinue = hasConnectAccount || country.length === 2;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setCountry('');
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {bountyAmount
              ? `You're about to earn ${currency} ${bountyAmount}!`
              : 'Set up payouts'}
          </DialogTitle>
          <DialogDescription>
            {bountyAmount
              ? "To receive your bounty reward, you'll need to set up payouts. This is a quick 2-minute process."
              : 'Set up payouts to receive your bounty rewards. This is a quick 2-minute process.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-4">
          {needsCountry && (
            <div className="space-y-2">
              <label
                htmlFor="country-select"
                className="text-sm font-medium text-foreground"
              >
                What country are you based in?
              </label>
              <Select
                value={country}
                onValueChange={(val) => setCountry(val ?? '')}
              >
                <SelectTrigger id="country-select">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectPopup>
                  {STRIPE_CONNECT_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <p className="text-xs text-muted-foreground">
                This determines your Stripe onboarding requirements and cannot
                be changed later.
              </p>
            </div>
          )}
          {!needsCountry && (
            <p className="text-sm text-muted-foreground">
              You'll be redirected to Stripe to complete identity verification.
              After setup, you'll be able to receive payments directly to your
              bank account.
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleLater}>
              I'll do this later
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!canContinue || createAccountLink.isPending}
            >
              {createAccountLink.isPending
                ? 'Loading...'
                : 'Continue to Payout Setup'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { STRIPE_CONNECT_COUNTRIES };
