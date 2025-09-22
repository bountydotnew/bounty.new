'use client';

import { authClient } from '@bounty/auth/client';
import type { ExtendedAuthSession } from '@bounty/types';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin';

export default function ImpersonatingGatePage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const sessionData = session as ExtendedAuthSession;
  const _impersonatedBy =
    sessionData?.session?.impersonatedBy || sessionData?.impersonatedBy;

  return (
    <div className="space-y-6">
      <AdminHeader
        description="Stop impersonating to view admin pages"
        title="Admin"
      />
      <Card className="border-red-900 bg-red-950/50">
        <CardHeader className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <CardTitle>Impersonation active</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-red-200 text-sm">
            You are impersonating {session?.user?.name || session?.user?.email}.
            Stop impersonating to view the admin panel.
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/')} variant="outline">
              Home
            </Button>
            <Button
              onClick={async () => {
                await authClient.admin.stopImpersonating({});
                router.replace('/admin');
              }}
            >
              Stop impersonating
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
