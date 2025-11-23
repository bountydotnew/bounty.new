import { CircleCheckIcon, CircleX, Info, TriangleAlert } from 'lucide-react';
import type { ToasterProps } from 'sonner';
import { toast } from 'sonner';
import type { ReasonCode } from '@bounty/types';

export const TOAST_OPTIONS = {
  unstyled: true,
  classNames: {
    icon: '!mt-[1.5px] !pl-[2px]',
    error: '!text-red-500',
    success: '!text-emerald-500',
    info: '!text-primary',
    warning: '!text-orange-500',
    title: 'text-xs font-medium mb-0.5',
    toast:
      'group toast !bg-background !p-4 !rounded-xl border !border-border/70 flex flex-row gap-2 !items-start w-full shadow-md select-none',
    description: '!text-secondary-foreground/50 text-xs',
    actionButton:
      'bg-black text-white dark:text-[currentColor] dark:bg-[currentColor]/10 hover:dark:bg-[currentColor]/20 min-w-max px-2 py-0.5 !text-[11px] h-fit !rounded-sm cursor-pointer duration-200',
    cancelButton:
      '!text-black dark:!text-white !text-[11px] h-fit !rounded-sm min-w-max px-2 py-0.5 bg-zinc-200 dark:bg-zinc-900/80 hover:dark:bg-zinc-800/80 cursor-pointer duration-200',
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
