'use client';

import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { trpc } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@bounty/ui';
import { useParams } from 'next/navigation';
import type { ProfileResponse } from '@bounty/types';

export default function ProfilePage() {
  const params = useParams();   
  const userId = params.userId as string;

  const profileData = useQuery({
    ...trpc.profiles.getProfile.queryOptions({ userId }),
    enabled: !!userId,
  });

  if (profileData.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (profileData.isError || !profileData.data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-white">User not found</h1>
        <p className="text-[#929292]">The user you are looking for does not exist.</p>
      </div>
    );
  }

  const { data } = profileData.data;
  const { user, profile, reputation } = data;

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 md:py-12">
      <div className="flex flex-col gap-8">
        <ProfileHeader 
          user={{
            ...user,
            createdAt: new Date(user.createdAt),
          }} 
          profile={profile ? {
            bio: (profile as ProfileResponse['profile'])?.bio ?? null,
            location: (profile as ProfileResponse['profile'])?.location ?? null,
            website: (profile as ProfileResponse['profile'])?.website ?? null,
            githubUsername: (profile as ProfileResponse['profile'])?.githubUsername ?? null,
            skills: (profile as ProfileResponse['profile'])?.skills ?? null,
          } : null} 
          reputation={reputation ? {
            totalEarned: (reputation as ProfileResponse['reputation'])?.totalEarned ?? null,
            bountiesCompleted: (reputation as ProfileResponse['reputation'])?.bountiesCompleted ?? null,
            bountiesCreated: (reputation as ProfileResponse['reputation'])?.bountiesCreated ?? null,
          } : null}
        />
        <ProfileTabs userId={userId} />
      </div>
    </div>
  );
}

