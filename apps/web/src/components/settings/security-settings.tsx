'use client';

import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { formatDate } from '@bounty/ui/lib/utils';
import { Laptop, Loader2, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';

export function SecuritySettings() {
  const router = useRouter();
  const [terminatingSession, setTerminatingSession] = useState<string | null>(
    null
  );

  // Mock active sessions data - in real implementation this would come from API
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'current-session',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      ipAddress: '192.168.1.1',
      isCurrent: true,
    },
    {
      id: 'mobile-session',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: '10.0.0.1',
      isCurrent: false,
    },
  ]);

  const removeActiveSession = (sessionId: string) => {
    setActiveSessions((sessions) =>
      sessions.filter((session) => session.id !== sessionId)
    );
  };

  const handleTerminateSession = async (
    session: (typeof activeSessions)[0]
  ) => {
    setTerminatingSession(session.id);

    try {
      // In real implementation, this would call the API to revoke the session
      // const result = await authClient.revokeSession({ token: session.token });

      // Mock successful termination
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Session terminated successfully');
      removeActiveSession(session.id);

      // If terminating current session, refresh the page
      if (session.isCurrent) {
        router.refresh();
      }
    } catch (error) {
      toast.error(`Failed to terminate session: ${error}`);
    } finally {
      setTerminatingSession(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active sessions found.
            </p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const parser = new UAParser(session.userAgent || '');
                const device = parser.getDevice();
                const os = parser.getOS();
                const browser = parser.getBrowser();
                const isMobile = device.type === 'mobile';

                return (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3"
                    key={session.id}
                  >
                    <div className="flex items-center gap-3">
                      {isMobile ? (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {os.name}, {browser.name}
                          </span>
                          {session.isCurrent && (
                            <Badge className="text-xs" variant="secondary">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>IP: {session.ipAddress}</span>
                          <span>•</span>
                          <span>
                            Last active: {formatDate(session.lastAccessedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      disabled={terminatingSession === session.id}
                      onClick={() => handleTerminateSession(session)}
                      size="sm"
                      variant="destructive"
                    >
                      {terminatingSession === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : session.isCurrent ? (
                        'Sign Out'
                      ) : (
                        'Terminate'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
