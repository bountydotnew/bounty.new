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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { useBilling } from '@/hooks/use-billing';
import type { CustomerState } from '@/types/billing';
import type { GetProfileResponse } from '@bounty/types';
import { trpc } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { Lock, Loader2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProfileClientProps {
  username: string;
  initialCustomerState?: CustomerState | null;
}

export function ProfileClient({
  username,
  initialCustomerState,
}: ProfileClientProps) {
  const router = useRouter();
  const [isClientMounted, setIsClientMounted] = useState(false);

  const { data: session, isPending: loading } = authClient.useSession();
  const isOwnProfile = username === 'me';
  const { isPro } = useBilling({
    enabled: true,
    initialCustomerState,
  });

  // Fetch profile by handle
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    ...trpc.profiles.getProfile.queryOptions({ handle: username }),
    enabled: !isOwnProfile && isClientMounted,
  });

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  if (!isClientMounted) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <Loader2 className="animate-spin" size={24} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session && loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <Loader2 className="animate-spin" size={24} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to view profiles.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOwnProfile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    alt={session?.user?.name || session?.user?.email}
                    src={session?.user?.image || ''}
                  />
                  <AvatarFallback>
                    {session?.user?.name?.[0] ||
                      session?.user?.email?.[0] ||
                      'U'}
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
                  <Badge variant="secondary">
                    User ID: {session?.user?.id}
                  </Badge>
                </div>
              </div>
              <Button
                className="flex items-center gap-2"
                onClick={() => router.push('/settings')}
                size="sm"
                variant="outline"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while fetching profile
  if (!isOwnProfile && isLoadingProfile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <Loader2 className="animate-spin" size={24} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cast profile data to GetProfileResponse type
  const profileResponse = profileData as unknown as GetProfileResponse | undefined;

  // Show private profile message if profile is private
  if (!isOwnProfile && profileResponse?.isPrivate) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile: @{username}</CardTitle>
            <CardDescription>Private user profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="mb-2 font-semibold text-lg">
                This profile is private
              </h3>
              <p className="text-muted-foreground">
                @{username} has set their profile to private.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show public profile
  if (!isOwnProfile && profileResponse?.data) {
    const profile = profileResponse.data;
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile: @{username}</CardTitle>
            <CardDescription>Public user profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <Avatar className="mx-auto mb-4 h-16 w-16">
                <AvatarImage alt={username} src={profile.user.image || ''} />
                <AvatarFallback>
                  {profile.user.name?.[0]?.toUpperCase() ||
                    username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="mb-2 font-semibold text-lg">
                {profile.user.name || `@${username}`}
              </h3>
              {profile.profile?.bio && (
                <p className="mb-4 text-muted-foreground">
                  {profile.profile.bio}
                </p>
              )}
              {!profile.profile && (
                <p className="mb-4 text-muted-foreground">
                  Public profiles are not yet fully implemented.
                </p>
              )}
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile: @{username}</CardTitle>
          <CardDescription>User profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
