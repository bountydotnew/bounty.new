"use client";

import { authClient } from "@bounty/auth/client";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const impersonatedBy = (session as any)?.session?.impersonatedBy || (session as any)?.impersonatedBy;
  if (impersonatedBy) {
    return (
      <div className="space-y-6">
        <AdminHeader description="Stop impersonating to view admin pages" title="Admin" />
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
              <Button variant="outline" onClick={() => router.push("/")}>Home</Button>
              <Button onClick={async () => { await authClient.admin.stopImpersonating({}); }}>Stop impersonating</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}

