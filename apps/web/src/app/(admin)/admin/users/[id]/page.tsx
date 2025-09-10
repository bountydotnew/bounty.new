'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { AdminHeader } from '@/components/admin';
import { Button } from '@bounty/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bounty/ui/components/card';
import { Input } from '@bounty/ui/components/input';
import { trpc } from '@/utils/trpc';

export default function AdminUserProfilePage() {
  const { id } = useParams<{ id: string }>();

  const profile = useQuery({ ...trpc.user.adminGetProfile.queryOptions({ userId: id }), staleTime: Infinity });
  const updateName = useMutation(trpc.user.adminUpdateName.mutationOptions());
  const invite = useMutation(trpc.user.inviteUser.mutationOptions());
  const sendNoti = useMutation(trpc.notifications.sendToUser.mutationOptions());

  const user = profile.data?.user;

  return (
    <div className="space-y-6">
      <AdminHeader description="User details and actions" title="User Profile" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-300 font-medium">Overview</CardTitle>
            <CardDescription className="text-xs text-neutral-500">Identity and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="text-neutral-400">Name</div>
              <div className="text-neutral-200">{user?.name}</div>
              <div className="text-neutral-400">Email</div>
              <div className="text-neutral-200">{user?.email}</div>
              <div className="text-neutral-400">Bounties created</div>
              <div className="text-neutral-200">{profile.data?.metrics.bountiesCreated ?? 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-300 font-medium">Actions</CardTitle>
            <CardDescription className="text-xs text-neutral-500">Manage account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <Input
                  defaultValue={user?.name ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== user?.name) updateName.mutate({ userId: id, name: v });
                  }}
                  className="border-neutral-800 bg-neutral-900"
                  placeholder="Change name"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => invite.mutate({ userId: id, accessStage: 'beta' })}>Set Beta</Button>
                  <Button size="sm" variant="outline" onClick={() => invite.mutate({ userId: id, accessStage: 'production' })}>Set Prod</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => sendNoti.mutate({ userId: id, title: 'Hello', message: 'Test message', type: 'custom' })}>Send Noti</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-300 font-medium">Sessions</CardTitle>
            <CardDescription className="text-xs text-neutral-500">Last 10 sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(profile.data?.sessions || []).map((s) => (
                <div key={s.id} className="rounded-md border border-neutral-800 bg-[#222222] p-2 text-xs text-neutral-300">
                  <div>{new Date(s.createdAt).toLocaleString()}</div>
                  <div className="text-neutral-500">{s.ipAddress} • {s.userAgent?.slice(0, 60)}</div>
                </div>
              ))}
              {profile.data?.sessions?.length === 0 && (
                <div className="text-neutral-500 text-sm">No recent sessions</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




