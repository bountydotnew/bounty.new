'use client';

import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { trpc } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@bounty/ui';
import { useParams } from 'next/navigation';
import type { GetProfileResponse, ProfileResponse } from '@bounty/types';
import { Lock } from 'lucide-react';

function prepareProfileData(
  profile: unknown,
  isPrivate: boolean
): { bio: string | null; location: string | null; website: string | null; githubUsername: string | null; skills: string[] | null } | null {
  if (isPrivate || !profile) {
    return null;
  }
  const p = profile as ProfileResponse['profile'];
  if (!p) {
    return null;
  }
  return {
    bio: p.bio ?? null,
    location: p.location ?? null,
    website: p.website ?? null,
    githubUsername: p.githubUsername ?? null,
    skills: p.skills ?? null,
  };
}

function prepareReputationData(
  reputation: unknown,
  isPrivate: boolean
): { totalEarned: string | null; bountiesCompleted: number | null; bountiesCreated: number | null } | null {
  if (isPrivate || !reputation) {
    return null;
  }
  const r = reputation as ProfileResponse['reputation'];
  if (!r) {
    return null;
  }
  return {
    totalEarned: r.totalEarned ?? null,
    bountiesCompleted: r.bountiesCompleted ?? null,
    bountiesCreated: r.bountiesCreated ?? null,
  };
}

function PrivateProfileMessage({ handle, fallbackHandle }: { handle: string | null; fallbackHandle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl p-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full">
        <Lock className="h-8 w-8 text-[#5A5A5A]" />
      </div>
      <h2 className="text-xl font-semibold text-white">This profile is private</h2>
      <p className="text-center text-[#929292]">
        @{handle || fallbackHandle} has set their profile to private.
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();   
  const handleOrUserId = params.userId as string;

  // Treat the param as a handle (since handles are what users will use in URLs)
  const profileData = useQuery({
    ...trpc.profiles.getProfile.queryOptions({ handle: handleOrUserId }),
    enabled: !!handleOrUserId,
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

  const response = profileData.data as unknown as GetProfileResponse;
  const { data } = response;
  const { user, profile, reputation } = data;
  const isPrivate = 'isPrivate' in response ? response.isPrivate : false;

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 md:py-12">
      <div className="flex flex-col gap-8">
        <ProfileHeader 
          user={{
            ...user,
            createdAt: new Date(user.createdAt),
          }} 
          profile={prepareProfileData(profile, isPrivate)}
          reputation={prepareReputationData(reputation, isPrivate)}
        />
        {isPrivate ? (
          <PrivateProfileMessage handle={(user as { handle?: string | null }).handle ?? null} fallbackHandle={handleOrUserId} />
        ) : (
          <ProfileTabs userId={user.id} />
        )}
      </div>
    </div>
  );
}

