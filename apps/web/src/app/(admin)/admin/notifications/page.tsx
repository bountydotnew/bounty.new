'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin';
import { ComposeForm } from '@/components/admin/notifications/compose-form';
import { UserSearchList } from '@/components/admin/notifications/user-search-list';
import { trpc, trpcClient } from '@/utils/trpc';

export default function AdminNotificationsPage() {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [linkTo, setLinkTo] = useState('');

  const { data, isLoading } = useQuery({
    ...trpc.user.getAllUsers.queryOptions({
      search: search || undefined,
      page: 1,
      limit: 10,
    }),
  });

  const users = useMemo(() => data?.users || [], [data?.users]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const promises = Array.from(selectedIds).map((userId) =>
        trpcClient.notifications.sendToUser.mutate({
          userId,
          title: title.trim(),
          message: message.trim(),
          type: 'custom',
          data: linkTo ? { linkTo } : undefined,
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      const count = selectedIds.size;
      toast.success(
        `Notification${count > 1 ? 's' : ''} sent to ${count} user${count > 1 ? 's' : ''}`
      );
      setTitle('');
      setMessage('');
      setLinkTo('');
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error(`Failed to send notification: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        description="Search users and send custom notifications"
        title="Send Notifications"
      />

      <Card className="border border-neutral-800 bg-[#222222]">
        <CardHeader>
          <CardTitle className="font-medium text-neutral-300 text-sm">
            Find users
          </CardTitle>
          <CardDescription className="text-neutral-500 text-xs">
            Search by name or email, then select recipients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserSearchList
            isLoading={isLoading}
            onClearSelection={() => setSelectedIds(new Set())}
            onSearchChange={setSearch}
            onToggle={(id) =>
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return next;
              })
            }
            search={search}
            selectedIds={selectedIds}
            users={users as { id: string; name: string; email: string }[]}
          />
        </CardContent>
      </Card>

      <Card className="border border-neutral-800 bg-[#222222]">
        <CardHeader>
          <CardTitle className="font-medium text-neutral-300 text-sm">
            Compose
          </CardTitle>
          <CardDescription className="text-neutral-500 text-xs">
            Craft the message and optional link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComposeForm
            count={selectedIds.size}
            isSending={sendMutation.isPending}
            linkTo={linkTo}
            message={message}
            onLinkTo={setLinkTo}
            onMessage={setMessage}
            onSend={() => {
              sendMutation.mutate();
            }}
            onTitle={setTitle}
            title={title}
          />
        </CardContent>
      </Card>
    </div>
  );
}
