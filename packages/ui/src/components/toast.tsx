'use client';

/**
 * Composable toast system built on top of Sonner
 *
 * @example
 * // Simple toast
 * toast.success('Bounty created successfully!');
 *
 * // Toast with description
 * toast.info('New notification', 'You have a new comment on your bounty');
 *
 * // Toast with options
 * toast.error('Payment failed', { duration: 10000 });
 *
 * // Custom toast
 * toast.custom(({ onDismiss }) => (
 *   <div>
 *     <p>Custom content</p>
 *     <button onClick={onDismiss}>Close</button>
 *   </div>
 * ));
 */

import { CircleCheckIcon, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import type { ExternalToast } from 'sonner';
import { toast as sonnerToast } from 'sonner';
import { cn } from '../lib/utils';
import type { JSX } from 'react';

type RenderContentProps = {
  onDismiss: () => void;
};

type WithRenderContent = {
  renderContent: (props: RenderContentProps) => JSX.Element;
  text?: never;
  description?: never;
  icon?: never;
};

type WithTextAndIcon = {
  text: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  renderContent?: never;
};

type BaseToastProps = (WithRenderContent | WithTextAndIcon) & {
  id: string | number;
};

const BaseToast = (props: BaseToastProps) => {
  const onDismiss = () => sonnerToast.dismiss(props.id);

  return (
    <div
      className={cn(
        'group toast flex flex-row gap-2 items-start bg-[#191919] p-4 rounded-xl border border-border/70 min-w-[280px] max-w-[840px]'
      )}
    >
      {props.renderContent ? (
        props.renderContent({ onDismiss })
      ) : (
        <>
          <props.icon
            className={cn('size-4 flex-shrink-0 mt-0.5', props.iconClassName)}
          />
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-sm font-medium text-white leading-relaxed">
              {props.text}
            </p>
            {props.description && (
              <p className="text-sm text-zinc-400 leading-relaxed">
                {props.description}
              </p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 cursor-pointer text-zinc-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </>
      )}
    </div>
  );
};

const toastStyles = {
  error: {
    icon: CircleX,
    iconClassName: 'text-red-500',
  },
  success: {
    icon: CircleCheckIcon,
    iconClassName: 'text-green-500',
  },
  warning: {
    icon: TriangleAlert,
    iconClassName: 'text-yellow-500',
  },
  info: {
    icon: Info,
    iconClassName: 'text-blue-500',
  },
} as const;

export const toast = {
  error: (
    text: string,
    descriptionOrProps?: string | ExternalToast,
    props?: ExternalToast
  ) => {
    const styles = toastStyles.error;
    // Handle both: toast.error('text', 'description', props) and toast.error('text', props)
    const description =
      typeof descriptionOrProps === 'string' ? descriptionOrProps : undefined;
    const toastProps =
      typeof descriptionOrProps === 'object' ? descriptionOrProps : props;

    const baseProps = {
      id: 0 as string | number,
      icon: styles.icon,
      iconClassName: styles.iconClassName,
      text,
    };
    const toastComponentProps = description
      ? { ...baseProps, description }
      : baseProps;

    return sonnerToast.custom(
      (id) => <BaseToast {...toastComponentProps} id={id} />,
      toastProps
    );
  },

  success: (
    text: string,
    descriptionOrProps?: string | ExternalToast,
    props?: ExternalToast
  ) => {
    const styles = toastStyles.success;
    const description =
      typeof descriptionOrProps === 'string' ? descriptionOrProps : undefined;
    const toastProps =
      typeof descriptionOrProps === 'object' ? descriptionOrProps : props;

    const baseProps = {
      id: 0 as string | number,
      icon: styles.icon,
      iconClassName: styles.iconClassName,
      text,
    };
    const toastComponentProps = description
      ? { ...baseProps, description }
      : baseProps;

    return sonnerToast.custom(
      (id) => <BaseToast {...toastComponentProps} id={id} />,
      toastProps
    );
  },

  warning: (
    text: string,
    descriptionOrProps?: string | ExternalToast,
    props?: ExternalToast
  ) => {
    const styles = toastStyles.warning;
    const description =
      typeof descriptionOrProps === 'string' ? descriptionOrProps : undefined;
    const toastProps =
      typeof descriptionOrProps === 'object' ? descriptionOrProps : props;

    const baseProps = {
      id: 0 as string | number,
      icon: styles.icon,
      iconClassName: styles.iconClassName,
      text,
    };
    const toastComponentProps = description
      ? { ...baseProps, description }
      : baseProps;

    return sonnerToast.custom(
      (id) => <BaseToast {...toastComponentProps} id={id} />,
      toastProps
    );
  },

  info: (
    text: string,
    descriptionOrProps?: string | ExternalToast,
    props?: ExternalToast
  ) => {
    const styles = toastStyles.info;
    const description =
      typeof descriptionOrProps === 'string' ? descriptionOrProps : undefined;
    const toastProps =
      typeof descriptionOrProps === 'object' ? descriptionOrProps : props;

    const baseProps = {
      id: 0 as string | number,
      icon: styles.icon,
      iconClassName: styles.iconClassName,
      text,
    };
    const toastComponentProps = description
      ? { ...baseProps, description }
      : baseProps;

    return sonnerToast.custom(
      (id) => <BaseToast {...toastComponentProps} id={id} />,
      toastProps
    );
  },

  custom: (
    renderContent: WithRenderContent['renderContent'],
    props?: ExternalToast
  ) => {
    return sonnerToast.custom(
      (id) => <BaseToast id={id} renderContent={renderContent} />,
      props
    );
  },

  // Re-export sonner methods for compatibility
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
  message: sonnerToast.message,
};
