'use client';

import { useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import {
  useProfileData,
  type ProfileData,
  type RawProfileResponse,
} from './hooks/use-profile-data';
import {
  ProfileLoadingState,
  ProfileNotFoundState,
  PrivateProfileMessage,
} from './components/profile-states';
import { trpc } from '@/utils/trpc';

interface ProfilePageClientProps {
  initialData?: ProfileData | null;
  serverData?: RawProfileResponse;
  serverTabData?: {
    bounties?: unknown;
    activity?: unknown;
    highlights?: unknown;
  };
}

export default function ProfilePageClient({
  initialData,
  serverData,
  serverTabData,
}: ProfilePageClientProps) {
  const params = useParams();
  const handleOrUserId = params.userId as string;
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useProfileData({
    handle: handleOrUserId,
    enabled: !!handleOrUserId,
    initialData: initialData ?? undefined,
    serverData,
  });

  // Seed tab query cache from server-prefetched data (runs once, render-time)
  const lastSeededUserIdRef = useRef<string | null>(null);
  if (
    data?.user?.id &&
    !data.isPrivate &&
    lastSeededUserIdRef.current !== data.user.id
  ) {
    lastSeededUserIdRef.current = data.user.id;
    const userId = data.user.id;

    if (serverTabData?.bounties) {
      const key = trpc.bounties.getBountiesByUserId.queryOptions({
        userId,
      }).queryKey;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(key, serverTabData.bounties as any);
    }
    if (serverTabData?.activity) {
      const key = trpc.user.getUserActivity.queryOptions({ userId }).queryKey;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(key, serverTabData.activity as any);
    }
    if (serverTabData?.highlights) {
      const key = trpc.bounties.getHighlights.queryOptions({ userId }).queryKey;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(key, serverTabData.highlights as any);
    }
  }

  // Prefetch tab data client-side (fallback if server didn't prefetch, idempotent)
  const lastPrefetchedUserIdRef = useRef<string | null>(null);
  if (
    data?.user?.id &&
    !data.isPrivate &&
    lastPrefetchedUserIdRef.current !== data.user.id
  ) {
    lastPrefetchedUserIdRef.current = data.user.id;
    const userId = data.user.id;
    queryClient.prefetchQuery(
      trpc.bounties.getBountiesByUserId.queryOptions({ userId })
    );
    queryClient.prefetchQuery(
      trpc.user.getUserActivity.queryOptions({ userId })
    );
    queryClient.prefetchQuery(
      trpc.bounties.getHighlights.queryOptions({ userId })
    );
  }

  // Loading state (skip if we have initialData)
  if (isLoading && !initialData) {
    return <ProfileLoadingState />;
  }

  // Error or not found state
  if (isError || !data || !data.user) {
    return <ProfileNotFoundState />;
  }

  const { user, profile, reputation, isPrivate } = data;

  // Prepare profile data for header
  const profileData = isPrivate
    ? null
    : {
        bio: profile?.bio ?? null,
        location: profile?.location ?? null,
        website: profile?.website ?? null,
        githubUsername: profile?.githubUsername ?? null,
        skills: profile?.skills ?? null,
      };

  // Prepare reputation data for header
  const reputationData = isPrivate
    ? null
    : {
        totalEarned: reputation?.totalEarned ?? null,
        bountiesCompleted: reputation?.bountiesCompleted ?? null,
        bountiesCreated: reputation?.bountiesCreated ?? null,
      };

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 md:py-12">
      <div className="flex flex-col gap-8">
        <ProfileHeader
          user={{
            ...user,
            createdAt: new Date(user.createdAt),
            email: user.email ?? '',
            image: user.image ?? '',
          }}
          profile={profileData}
          reputation={reputationData}
        />
        {isPrivate ? (
          <PrivateProfileMessage
            handle={user.handle ?? null}
            fallbackHandle={handleOrUserId}
          />
        ) : (
          <ProfileTabs userId={user.id} />
        )}
      </div>
    </div>
  );
}
