'use client';

import { authClient } from '@bounty/auth/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { useBilling } from '@/hooks/use-billing';
import type { CustomerState } from '@/types/billing';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface GeneralSettingsProps {
  initialCustomerState?: CustomerState | null;
}

type FeatureItem = {
  title: string;
  description: string;
  badgeLabel: string;
  badgeVariant: 'default' | 'secondary';
};

async function signOutAndRedirect(router: ReturnType<typeof useRouter>) {
  try {
    await authClient.signOut();
    router.push('/');
  } catch (_error) {
    toast.error('Failed to sign out');
  }
}

const LoadingCard = () => (
  <Card>
    <CardContent className="p-6">
      <Loader2 className="animate-spin" size={24} />
    </CardContent>
  </Card>
);

interface ProfileInformationCardProps {
  email?: string | null;
  id?: string | null;
  image?: string | null;
  isPro: boolean;
  name?: string | null;
}

const ProfileInformationCard = ({
  email,
  id,
  image,
  isPro,
  name,
}: ProfileInformationCardProps) => {
  const avatarFallback = name?.[0] ?? email?.[0] ?? 'U';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              alt={name || email || undefined}
              src={image || undefined}
            />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{name || 'No name set'}</h3>
              {isPro && <Badge variant="default">Pro</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">{email}</p>
            <Badge variant="secondary">User ID: {id || 'Unknown'}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface FeaturesCardProps {
  billingLoading: boolean;
  isPro: boolean;
}

const FeaturesCard = ({ billingLoading, isPro }: FeaturesCardProps) => {
  const features: FeatureItem[] = [
    {
      title: 'Lower Fees',
      description: 'Reduced platform fees on bounties',
      badgeLabel: isPro ? 'Enabled' : 'Disabled',
      badgeVariant: isPro ? 'default' : 'secondary',
    },
    {
      title: 'Concurrent Bounties',
      description: 'Create multiple active bounties',
      badgeLabel: isPro ? 'Unlimited' : 'Limited',
      badgeVariant: isPro ? 'default' : 'secondary',
    },
    {
      title: 'Payment Button',
      description: 'Embeddable payment buttons for GitHub',
      badgeLabel: 'Available',
      badgeVariant: 'default',
    },
    {
      title: 'Passkey Security',
      description: 'Passwordless authentication',
      badgeLabel: 'Available',
      badgeVariant: 'default',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Features</CardTitle>
      </CardHeader>
      <CardContent>
        {billingLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-muted-foreground text-sm">
              Loading features...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{feature.title}</span>
                  <Badge variant={feature.badgeVariant}>
                    {feature.badgeLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AccountActionsCardProps {
  onSignOut: () => void;
}

const AccountActionsCard = ({ onSignOut }: AccountActionsCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Account Actions</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Sign Out</h4>
          <p className="text-muted-foreground text-sm">
            Sign out of your account
          </p>
        </div>
        <Button onClick={onSignOut} variant="outline">
          Sign Out
        </Button>
      </div>
    </CardContent>
  </Card>
);

export function GeneralSettings({
  initialCustomerState,
}: GeneralSettingsProps) {
  const { data: session } = authClient.useSession();
  const { isPro, isLoading: billingLoading } = useBilling({
    enabled: true,
    initialCustomerState,
  });
  const router = useRouter();

  const handleSignOut = useCallback(() => {
    signOutAndRedirect(router);
  }, [router]);

  if (!session) {
    return <LoadingCard />;
  }

  const { user } = session;

  return (
    <div className="space-y-6">
      <ProfileInformationCard
        email={user?.email}
        id={user?.id}
        image={user?.image}
        isPro={isPro}
        name={user?.name}
      />
      <FeaturesCard billingLoading={billingLoading} isPro={isPro} />
      <AccountActionsCard onSignOut={handleSignOut} />
    </div>
  );
}
