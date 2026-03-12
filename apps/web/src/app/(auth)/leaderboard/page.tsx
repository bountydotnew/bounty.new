'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@bounty/ui/components/tabs';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { AuthGuard } from '@/components/auth/auth-guard';

function LeaderboardPageContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Header title="Bounty Leaderboard" />
      
      <Tabs defaultValue="hunters" className="w-full">
        <TabsList className="w-full max-w-md mx-auto mb-8">
          <TabsTrigger value="hunters">🏆 Bounty Hunters</TabsTrigger>
          <TabsTrigger value="creators">💼 Bounty Creators</TabsTrigger>
        </TabsList>

        <TabsContent value="hunters" className="space-y-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Top Bounty Hunters</h2>
            <p className="text-muted-foreground">Leaderboard coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Top Bounty Creators</h2>
            <p className="text-muted-foreground">Leaderboard coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AuthGuard>
      <LeaderboardPageContent />
    </AuthGuard>
  );
}
