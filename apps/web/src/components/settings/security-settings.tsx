'use client';

import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import { formatDate } from '@bounty/ui/lib/utils';
import { Laptop, Loader2, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';
import { cn } from '@bounty/ui/lib/utils';

const SECTION_PADDING = 'py-[18px]';
const SECTION_TITLE = 'text-[20px] leading-[150%] text-foreground font-medium';

export function SecuritySettings() {
  const router = useRouter();
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  // Mock active sessions data - in real implementation this would come from API
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'current-session',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      ipAddress: '192.168.1.1',
      isCurrent: true,
    },
    {
      id: 'mobile-session',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: '10.0.0.1',
      isCurrent: false,
    },
  ]);

  const removeActiveSession = useCallback((sessionId: string) => {
    setActiveSessions((sessions) => sessions.filter((session) => session.id !== sessionId));
  }, []);

  const handleTerminateSession = useCallback(async (session: (typeof activeSessions)[0]) => {
    setTerminatingSession(session.id);

    try {
      // In real implementation, this would call the API to revoke the session
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
  }, [removeActiveSession, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex justify-between items-start pb-4 border-b border-border">
        <div className="flex flex-col justify-end">
          <h1 className="text-[28px] leading-[150%] text-foreground font-medium">
            Security
          </h1>
          <p className="text-[16px] leading-[150%] text-text-secondary font-medium">
            Manage your security settings and authentication
          </p>
        </div>
      </header>

      {/* Active Sessions */}
      <section className={cn('flex flex-col gap-4 border-b border-border', SECTION_PADDING)}>
        <h2 className={SECTION_TITLE}>Active Sessions</h2>

        {activeSessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active sessions found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeSessions.map((session) => {
              const parser = new UAParser(session.userAgent || '');
              const device = parser.getDevice();
              const os = parser.getOS();
              const browser = parser.getBrowser();
              const isMobile = device.type === 'mobile';

              return (
                <div
                  className="flex items-center justify-between rounded-lg p-3"
                  key={session.id}
                >
                  <div className="flex items-center gap-3">
                    {isMobile ? (
                      <Smartphone className="size-4 text-muted-foreground" />
                    ) : (
                      <Laptop className="size-4 text-muted-foreground" />
                    )}
                    <div className="flex flex-col gap-1">
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
                        <span>Last active: {formatDate(session.lastAccessedAt)}</span>
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
                      <Loader2 className="size-4 animate-spin" />
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
      </section>
    </div>
  );
}
