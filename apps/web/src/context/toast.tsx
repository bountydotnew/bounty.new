import { CircleCheckIcon, CircleX, Info, TriangleAlert } from 'lucide-react';
import type { ToasterProps } from 'sonner';
import { toast } from '@bounty/ui/components/toast';
import type { ReasonCode } from '@bounty/types';

export const TOAST_OPTIONS = {
  unstyled: true,
  classNames: {
    toast:
      'group toast flex flex-row gap-2 !items-start !bg-[#191919] !p-4 !rounded-xl !border !border-border/70 !min-w-[250px] !max-w-[600px]',
  },
} satisfies ToasterProps['toastOptions'];

export const TOAST_ICONS = {
  error: <CircleX className="size-4" />,
  success: <CircleCheckIcon className="size-4" />,
  warning: <TriangleAlert className="size-4" />,
  info: <Info className="size-4" />,
} satisfies ToasterProps['icons'];

const MESSAGE_BY_REASON: Record<ReasonCode, string> = {
  unauthenticated: 'Please sign in to continue.',
  beta_required: 'Beta access required to use this area.',
  email_unverified: 'Verify your email to continue.',
  banned: 'Your account is suspended. Contact support.',
  plan_required: 'An upgraded plan is required to use this feature.',
  forbidden: "You don't have permission to perform this action.",
};

const dedupe = new Map<string, number>();

export function showAppErrorToast(
  reason: ReasonCode | undefined,
  opts?: { messageOverride?: string }
): void {
  const key = `${reason || 'unknown'}:${opts?.messageOverride || ''}`;
  const now = Date.now();
  const last = dedupe.get(key) || 0;
  if (now - last < 3000) {
    return;
  }
  dedupe.set(key, now);

  const message =
    opts?.messageOverride || (reason ? MESSAGE_BY_REASON[reason] : undefined);
  toast.error(message || 'Something went wrong. Please try again.');
}
