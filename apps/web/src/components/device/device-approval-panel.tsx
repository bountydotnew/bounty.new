'use client';

import { authClient } from '@bounty/auth/client';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Spinner } from '@bounty/ui/components/spinner';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type DeviceStatus = 'pending' | 'approved' | 'denied';

interface DeviceApprovalPanelProps {
  userCode: string;
}

const normalizeCode = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

const formatForDisplay = (value: string) => {
  const normalized = normalizeCode(value);
  if (!normalized) {
    return '';
  }
  return normalized.match(/.{1,4}/g)?.join('-') ?? normalized;
};

const STATUS_TEXT: Record<DeviceStatus, { label: string; tone: string }> = {
  pending: {
    label: 'Awaiting approval',
    tone: 'bg-amber-500/10 text-amber-400',
  },
  approved: { label: 'Approved', tone: 'bg-emerald-500/10 text-emerald-400' },
  denied: { label: 'Denied', tone: 'bg-red-500/10 text-red-400' },
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

const getActionSuccessMessage = (type: 'approve' | 'deny'): string => {
  return type === 'approve'
    ? 'Device approved. You can return to the requesting device.'
    : 'Device denied. The requesting device has been notified.';
};

export function DeviceApprovalPanel({ userCode }: DeviceApprovalPanelProps) {
  const router = useRouter();
  const sanitizedCode = useMemo(() => normalizeCode(userCode), [userCode]);
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'approve' | 'deny' | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  useEffect(() => {
    if (!(sessionLoading || session?.user) && sanitizedCode) {
      router.replace(
        `/login?redirect=/device/approve?user_code=${sanitizedCode}`
      );
    }
  }, [router, sanitizedCode, session, sessionLoading]);

  useEffect(() => {
    if (!sanitizedCode) {
      setError('Missing device code.');
      setIsLoading(false);
      return;
    }

    let active = true;

    const handleFetchSuccess = (data: { status: string }) => {
      setStatus(data.status as DeviceStatus);
    };

    const handleFetchError = (fetchError: unknown) => {
      const message = getErrorMessage(
        fetchError,
        'Unable to load device request.'
      );
      setError(message);
      setStatus(null);
    };

    const fetchStatus = async () => {
      setIsLoading(true);
      setError(null);

      const response = await authClient.device({
        query: { user_code: sanitizedCode },
      });

      if (!active) {
        return;
      }

      if (!response.data) {
        throw new Error(
          response.error?.error_description || 'Unable to load device request.'
        );
      }

      handleFetchSuccess(response.data);
    };

    const loadDeviceStatus = async () => {
      try {
        await fetchStatus();
      } catch (fetchError) {
        if (active) {
          handleFetchError(fetchError);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadDeviceStatus();

    return () => {
      active = false;
    };
  }, [sanitizedCode]);

  const executeDeviceAction = async (type: 'approve' | 'deny') => {
    const action =
      type === 'approve'
        ? authClient.device.approve({ userCode: sanitizedCode })
        : authClient.device.deny({ userCode: sanitizedCode });

    const response = await action;

    if (response.error) {
      const errorMessage =
        'error_description' in response.error
          ? response.error.error_description
          : response.error.message || 'An error occurred';
      throw new Error(errorMessage);
    }

    return type === 'approve' ? 'approved' : 'denied';
  };

  const handleAction = async (type: 'approve' | 'deny') => {
    if (!sanitizedCode) {
      return;
    }

    setActionLoading(type);
    setError(null);

    try {
      const nextStatus = await executeDeviceAction(type);
      setStatus(nextStatus as DeviceStatus);
      toast.success(getActionSuccessMessage(type));
    } catch (actionError) {
      const message = getErrorMessage(
        actionError,
        'Unable to update device request.'
      );
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const formattedCode = formatForDisplay(sanitizedCode);
  const currentStatus = status ? STATUS_TEXT[status] : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="border border-muted bg-[#111111] text-white">
        <CardHeader className="gap-3">
          <CardTitle className="font-semibold text-2xl">
            Device authorization request
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Confirm that you want to grant access to the device using this code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-muted-foreground text-sm">
              Verification code
            </span>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-neutral-900 px-3 py-2 font-mono text-lg tracking-[0.4rem]">
                {formattedCode || '—'}
              </span>
              {currentStatus && (
                <Badge
                  className={`rounded-full px-3 py-1 text-xs ${currentStatus.tone}`}
                >
                  {currentStatus.label}
                </Badge>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What happens next?</h3>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
              <li>Approving grants the device a short-lived access token.</li>
              <li>
                Denying rejects the request and the device will show an error.
              </li>
              <li>Codes expire automatically if you take no action.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Button
              className="h-11 flex-1 rounded-lg bg-primary text-primary-foreground"
              disabled={
                isLoading ||
                !!actionLoading ||
                status === 'approved' ||
                !sanitizedCode
              }
              onClick={() => handleAction('approve')}
            >
              {actionLoading === 'approve' ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Approving…
                </span>
              ) : (
                'Approve'
              )}
            </Button>
            <Button
              className="h-11 flex-1 rounded-lg border border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
              disabled={
                isLoading ||
                !!actionLoading ||
                status === 'denied' ||
                !sanitizedCode
              }
              onClick={() => handleAction('deny')}
              variant="secondary"
            >
              {actionLoading === 'deny' ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Denying…
                </span>
              ) : (
                'Deny'
              )}
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Spinner size="sm" />
              Checking device status…
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
