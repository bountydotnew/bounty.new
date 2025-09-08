'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bounty/ui/components/card';
import { trpc } from '@/utils/trpc';
import { UserSearchList } from '@/components/admin/notifications/user-search-list';
import { ComposeForm } from '@/components/admin/notifications/compose-form';

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
    ...trpc.notifications.sendToUser.mutationOptions(),
    onSuccess: () => {
      toast.success('Notification sent');
      setTitle('');
      setMessage('');
      setLinkTo('');
    },
    onError: () => toast.error('Failed to send notification'),
  });

  const _canSend =
    selectedIds.size > 0 &&
    title.trim().length > 0 &&
    message.trim().length > 0;

  return (
    <div className="space-y-6">
      <AdminHeader
        description="Search users and send custom notifications"
        title="Send Notifications"
      />

      <Card className="border border-neutral-800 bg-[#222222]">
        <CardHeader>
          <CardTitle className="text-sm text-neutral-300 font-medium">Find users</CardTitle>
          <CardDescription className="text-xs text-neutral-500">Search by name or email, then select recipients</CardDescription>
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
          <CardTitle className="text-sm text-neutral-300 font-medium">Compose</CardTitle>
          <CardDescription className="text-xs text-neutral-500">Craft the message and optional link</CardDescription>
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
              const ids = Array.from(selectedIds);
              ids.forEach((id) => {
                sendMutation.mutate({
                  userId: id,
                  title: title.trim(),
                  message: message.trim(),
                  type: 'custom',
                  data: linkTo ? { linkTo } : undefined,
                });
              });
            }}
            onTitle={setTitle}
            title={title}
          />
        </CardContent>
      </Card>
    </div>
  );
}
