'use client';

import { authClient } from '@bounty/auth/client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@bounty/ui/components/avatar';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@bounty/ui/components/card';
import { useBilling } from '@bounty/ui/hooks/use-billing';

export function GeneralSettings() {
  const [isClientMounted, setIsClientMounted] = useState(false);
  const { data: session } = authClient.useSession();
  const { isPro, isLoading: billingLoading } = useBilling();
  const router = useRouter();
  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/');
    } catch (_error) {
      toast.error('Failed to sign out');
    }
  };

  // Don't render until client is mounted to prevent hydration issues
  if (!(isClientMounted && session)) {
    return (
      <Card>
        <CardContent className="p-6">
          <Loader2 className="animate-spin" size={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                alt={session?.user?.name || session?.user?.email}
                src={session?.user?.image || ''}
              />
              <AvatarFallback>
                {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {session?.user?.name || 'No name set'}
                </h3>
                {isPro && <Badge variant="default">Pro</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">
                {session?.user?.email}
              </p>
              <Badge variant="secondary">User ID: {session?.user?.id}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Features */}
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
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Lower Fees</span>
                  <Badge variant={isPro ? 'default' : 'secondary'}>
                    {isPro ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  Reduced platform fees on bounties
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Concurrent Bounties</span>
                  <Badge variant={isPro ? 'default' : 'secondary'}>
                    {isPro ? 'Unlimited' : 'Limited'}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  Create multiple active bounties
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment Button</span>
                  <Badge variant="default">Available</Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  Embeddable payment buttons for GitHub
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Passkey Security</span>
                  <Badge variant="default">Available</Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  Passwordless authentication
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
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
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
