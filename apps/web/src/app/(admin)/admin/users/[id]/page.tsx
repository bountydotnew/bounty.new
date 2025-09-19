'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Input } from '@bounty/ui/components/input';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { AdminHeader } from '@/components/admin';
import { trpc } from '@/utils/trpc';

export default function AdminUserProfilePage() {
  const { id } = useParams<{ id: string }>();

  const profile = useQuery({
    ...trpc.user.adminGetProfile.queryOptions({ userId: id }),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const updateName = useMutation(trpc.user.adminUpdateName.mutationOptions());
  const invite = useMutation(trpc.user.inviteUser.mutationOptions());
  const sendNoti = useMutation(trpc.notifications.sendToUser.mutationOptions());

  const user = profile.data?.user;

  return (
    <div className="space-y-6">
      <AdminHeader
        description="User details and actions"
        title="User Profile"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader>
            <CardTitle className="font-medium text-neutral-300 text-sm">
              Overview
            </CardTitle>
            <CardDescription className="text-neutral-500 text-xs">
              Identity and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="text-neutral-400">Name</div>
              <div className="text-neutral-200">{user?.name}</div>
              <div className="text-neutral-400">Email</div>
              <div className="text-neutral-200">{user?.email}</div>
              <div className="text-neutral-400">Bounties created</div>
              <div className="text-neutral-200">
                {profile.data?.metrics.bountiesCreated ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader>
            <CardTitle className="font-medium text-neutral-300 text-sm">
              Actions
            </CardTitle>
            <CardDescription className="text-neutral-500 text-xs">
              Manage account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <Input
                  className="border-neutral-800 bg-neutral-900"
                  defaultValue={user?.name ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== user?.name)
                      updateName.mutate({ userId: id, name: v });
                  }}
                  placeholder="Change name"
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      invite.mutate({ userId: id, accessStage: 'beta' })
                    }
                    size="sm"
                  >
                    Set Beta
                  </Button>
                  <Button
                    onClick={() =>
                      invite.mutate({ userId: id, accessStage: 'production' })
                    }
                    size="sm"
                    variant="outline"
                  >
                    Set Prod
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      sendNoti.mutate({
                        userId: id,
                        title: 'Hello',
                        message: 'Test message',
                        type: 'custom',
                      })
                    }
                    size="sm"
                  >
                    Send Noti
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#222222]">
          <CardHeader>
            <CardTitle className="font-medium text-neutral-300 text-sm">
              Sessions
            </CardTitle>
            <CardDescription className="text-neutral-500 text-xs">
              Last 10 sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(profile.data?.sessions || []).map((s) => (
                <div
                  className="rounded-md border border-neutral-800 bg-[#222222] p-2 text-neutral-300 text-xs"
                  key={s.id}
                >
                  <div>{new Date(s.createdAt).toLocaleString()}</div>
                  <div className="text-neutral-500">
                    {s.ipAddress} • {s.userAgent?.slice(0, 60)}
                  </div>
                </div>
              ))}
              {profile.data?.sessions?.length === 0 && (
                <div className="text-neutral-500 text-sm">
                  No recent sessions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
