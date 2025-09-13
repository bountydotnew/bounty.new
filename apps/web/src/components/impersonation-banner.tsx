'use client';

import { authClient } from '@bounty/auth/client';
import type { ExtendedAuthSession } from '@bounty/types';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@bounty/ui/components/button';
import { ImpersonationUserPicker } from '@/components/admin/impersonation-user-picker';

export default function ImpersonationBanner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const sessionData = session as ExtendedAuthSession;
  const impersonatedBy =
    sessionData?.session?.impersonatedBy ||
    sessionData?.impersonatedBy;
  if (!impersonatedBy) {
    return null;
  }
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-red-800 border-b bg-red-950/70 backdrop-blur supports-[backdrop-filter]:bg-red-950/50">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-2 text-red-200">
        <ShieldAlert className="h-4 w-4 text-red-400" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm">Impersonating</span>
          <span className="truncate font-semibold text-red-300 text-sm">
            {session?.user?.name || session?.user?.email}
          </span>
          <span className="text-red-400/60">({session?.user?.email})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="h-7 border-red-800 bg-transparent text-red-200 hover:bg-red-900/50"
            onClick={() => setOpen(true)}
            size="sm"
            variant="outline"
          >
            Switch user
          </Button>
          <Button
            className="h-7 border-red-800 bg-transparent text-red-200 hover:bg-red-900/50"
            onClick={() => router.push('/admin')}
            size="sm"
            variant="outline"
          >
            Admin
          </Button>
          <Button
            className="h-7 border-red-800 bg-red-900/70 text-red-50 hover:bg-red-800"
            onClick={() => {
              authClient.admin
                .stopImpersonating({})
                .then(({ error }) => {
                  if (error) {
                    throw new Error(
                      error.message || 'Failed to stop impersonating'
                    );
                  }
                  queryClient.invalidateQueries();
                  window.dispatchEvent(new Event('visibilitychange'));
                  router.refresh();
                })
                .catch(() => {});
            }}
            size="sm"
            variant="outline"
          >
            End
          </Button>
        </div>
      </div>
      <ImpersonationUserPicker
        onOpenChange={setOpen}
        onPick={(userId) => {
          const go = async () => {
            try {
              if (impersonatedBy) {
                const stop = await authClient.admin.stopImpersonating({});
                if (stop.error) {
                  throw new Error(
                    stop.error.message || 'Failed to stop impersonating'
                  );
                }
              }
              const res = await authClient.admin.impersonateUser({ userId });
              if (res.error) {
                throw new Error(res.error.message || 'Failed to impersonate');
              }
              setOpen(false);
              queryClient.invalidateQueries();
              window.dispatchEvent(new Event('visibilitychange'));
              router.refresh();
            } catch {}
          };
          go();
        }}
        open={open}
      />
    </div>
  );
}
