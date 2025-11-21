'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@bounty/ui/components/avatar';
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon, LinkIcon } from 'lucide-react';
import { GitHubActivityChart } from './github-activity-chart';
import type { ProfileUser, ProfileData, ProfileReputation } from '@bounty/types';

interface ProfileHeaderProps {
  user: ProfileUser;
  profile: Pick<ProfileData, 'bio' | 'location' | 'website' | 'githubUsername' | 'skills'> | null;
  reputation: Pick<ProfileReputation, 'totalEarned' | 'bountiesCompleted' | 'bountiesCreated'> | null;
}

export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
          <Avatar className="h-24 w-24 rounded-xl border-2 border-[#232323] shadow-lg md:h-32 md:w-32">
            {user.image && (
              <AvatarImage alt={user.name || 'User'} src={user.image} className="rounded-xl" />
            )}
            <AvatarFallback className="rounded-xl text-4xl bg-[#232323] text-[#5A5A5A]">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-white md:text-3xl">
                {user.name || 'Anonymous User'}
              </h1>
              {profile?.githubUsername && (
                <a 
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#5A5A5A] hover:text-[#CFCFCF] transition-colors w-fit"
                >
                  @{profile.githubUsername}
                </a>
              )}
            </div>

            {profile?.bio && (
              <p className="max-w-md text-sm text-[#929292]">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-[#5A5A5A]">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
              </div>
              
              {profile?.location && (
                <div className="flex items-center gap-1.5">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile?.website && (
                <a 
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[#CFCFCF] transition-colors"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* <div className="flex gap-8 rounded-xl border border-[#232323] bg-[#191919] px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-[#5A5A5A]">Earned</span>
            <span className="text-xl font-semibold text-white">
              ${Number(reputation?.totalEarned || 0).toLocaleString()}
            </span>
          </div>
          <div className="h-full w-px bg-[#232323]" />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-[#5A5A5A]">Created</span>
            <span className="text-xl font-semibold text-white">
              {reputation?.bountiesCreated || 0}
            </span>
          </div>
          <div className="h-full w-px bg-[#232323]" />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-[#5A5A5A]">Completed</span>
            <span className="text-xl font-semibold text-white">
              {reputation?.bountiesCompleted || 0}
            </span>
          </div>
        </div> */}
      </div>

      {profile?.githubUsername && (
        <GitHubActivityChart username={profile.githubUsername} />
      )}
    </div>
  );
}

