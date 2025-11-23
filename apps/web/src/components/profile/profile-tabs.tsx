'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bounty/ui/components/tabs';
import { ProfileBounties } from './profile-bounties';
import { ProfileActivity } from './profile-activity';
import { ProfileHighlights } from './profile-highlights';
import { ProfileCompleted } from './profile-completed';

interface ProfileTabsProps {
  userId: string;
}

export function ProfileTabs({ userId }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="bounties" className="w-full">
      <TabsList className="bg-[#191919] border border-[#232323]">
        <TabsTrigger value="bounties">Bounties</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="highlights">Highlights</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>

      <TabsContent value="bounties" className="mt-6">
        <ProfileBounties userId={userId} />
      </TabsContent>

      <TabsContent value="activity" className="mt-6">
        <ProfileActivity userId={userId} />
      </TabsContent>

      <TabsContent value="highlights" className="mt-6">
        <ProfileHighlights userId={userId} />
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <ProfileCompleted />
      </TabsContent>
    </Tabs>
  );
}
