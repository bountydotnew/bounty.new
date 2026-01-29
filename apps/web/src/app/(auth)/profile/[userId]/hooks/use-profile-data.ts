'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

export interface ProfileData {
  user: {
    id: string;
    name: string | null;
    handle: string | null;
    email: string | null;
    image: string | null;
    createdAt: string;
    isProfilePrivate: boolean;
  };
  profile: {
    bio: string | null;
    location: string | null;
    website: string | null;
    githubUsername: string | null;
    skills: string[] | null;
  } | null;
  reputation: {
    totalEarned: string | null;
    bountiesCompleted: number | null;
    bountiesCreated: number | null;
  } | null;
  isPrivate: boolean;
}

export interface UseProfileDataProps {
  handle: string;
  enabled: boolean;
}

export interface UseProfileDataReturn {
  data: ProfileData | null;
  isLoading: boolean;
  isError: boolean;
}

export function useProfileData({
  handle,
  enabled,
}: UseProfileDataProps): UseProfileDataReturn {
  const query = useQuery({
    ...trpc.profiles.getProfile.queryOptions({ handle }),
    enabled,
  });

  return {
    data: query.data as unknown as ProfileData | null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
