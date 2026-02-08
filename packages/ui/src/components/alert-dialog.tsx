'use client';

import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import * as React from 'react';
import { createContext, useContext, useState, type ReactNode } from 'react';

import { cn } from '@bounty/ui/lib/utils';

// ============================================================================
// Base UI AlertDialog Components (new coss API)
// ============================================================================

const AlertDialogCreateHandle = AlertDialogPrimitive.createHandle;

const AlertDialogRoot = AlertDialogPrimitive.Root;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogTrigger({
  asChild,
  children,
  ...props
}: AlertDialogPrimitive.Trigger.Props & { asChild?: boolean }) {
  let finalRender = props.render;
  let finalChildren = children;
  if (asChild && !props.render && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>;
    // Apply trigger props (onClick, ref, etc.) to the child element, but preserve its children
    finalRender = (triggerProps: any) => {
      const { children: _ignoredChildren, ...propsToMerge } = triggerProps;
      return React.cloneElement(childElement, propsToMerge);
    };
    finalChildren = undefined;
  }
  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      {...props}
      render={finalRender}
    >
      {finalChildren}
    </AlertDialogPrimitive.Trigger>
  );
}

function AlertDialogBackdrop({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0',
        className
      )}
      data-slot="alert-dialog-backdrop"
      {...props}
    />
  );
}

function AlertDialogViewport({
  className,
  ...props
}: AlertDialogPrimitive.Viewport.Props) {
  return (
    <AlertDialogPrimitive.Viewport
      className={cn(
        'fixed inset-0 z-50 grid grid-rows-[1fr_auto_3fr] justify-items-center p-4',
        className
      )}
      data-slot="alert-dialog-viewport"
      {...props}
    />
  );
}

function AlertDialogPopup({
  className,
  bottomStickOnMobile = true,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  bottomStickOnMobile?: boolean;
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogBackdrop />
      <AlertDialogViewport
        className={cn(
          bottomStickOnMobile &&
            'max-sm:grid-rows-[1fr_auto] max-sm:p-0 max-sm:pt-12'
        )}
      >
        <AlertDialogPrimitive.Popup
          className={cn(
            '-translate-y-[calc(1.25rem*var(--nested-dialogs))] relative row-start-2 flex max-h-full min-h-0 w-full min-w-0 max-w-lg scale-[calc(1-0.1*var(--nested-dialogs))] flex-col rounded-2xl border bg-popover not-dark:bg-clip-padding text-popover-foreground opacity-[calc(1-0.1*var(--nested-dialogs))] shadow-lg/5 transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/6%)] data-nested:data-ending-style:translate-y-8 data-nested:data-starting-style:translate-y-8 data-nested-dialog-open:origin-top data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]',
            bottomStickOnMobile &&
              'max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-t max-sm:border-b-0 max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))] max-sm:data-ending-style:translate-y-4 max-sm:data-starting-style:translate-y-4 max-sm:before:hidden max-sm:before:rounded-none',
            className
          )}
          data-slot="alert-dialog-popup"
          {...props}
        />
      </AlertDialogViewport>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-6 text-center max-sm:pb-4 sm:text-left',
        className
      )}
      data-slot="alert-dialog-header"
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  variant?: 'default' | 'bare';
}) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 px-6 sm:flex-row sm:justify-end sm:rounded-b-[calc(var(--radius-2xl)-1px)]',
        variant === 'default' && 'border-t bg-muted/72 py-4',
        variant === 'bare' && 'pb-6',
        className
      )}
      data-slot="alert-dialog-footer"
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      className={cn(
        'font-heading font-semibold text-xl leading-none',
        className
      )}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

function AlertDialogClose({
  asChild,
  children,
  ...props
}: AlertDialogPrimitive.Close.Props & { asChild?: boolean }) {
  let finalRender = props.render;
  let finalChildren = children;
  if (asChild && !props.render && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>;
    // Apply close props (onClick, ref, etc.) to the child element, but preserve its children
    finalRender = (closeProps: any) => {
      const { children: _ignoredChildren, ...propsToMerge } = closeProps;
      return React.cloneElement(childElement, propsToMerge);
    };
    finalChildren = undefined;
  }
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-close"
      {...props}
      render={finalRender}
    >
      {finalChildren}
    </AlertDialogPrimitive.Close>
  );
}

// ============================================================================
// Legacy Compound AlertDialog (backward compatibility)
// ============================================================================

interface LegacyAlertDialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

const LegacyAlertDialogContext =
  createContext<LegacyAlertDialogContextValue | null>(null);

function useLegacyAlertDialogContext() {
  const context = useContext(LegacyAlertDialogContext);
  if (!context) {
    throw new Error(
      'AlertDialog components must be used within AlertDialogProvider'
    );
  }
  return context;
}

interface LegacyAlertDialogProviderProps extends LegacyAlertDialogContextValue {
  children: ReactNode;
}

function LegacyAlertDialogProvider({
  children,
  ...contextValue
}: LegacyAlertDialogProviderProps) {
  return (
    <LegacyAlertDialogContext.Provider value={contextValue}>
      <AlertDialogRoot
        open={contextValue.open}
        onOpenChange={contextValue.onOpenChange}
      >
        <AlertDialogPortal>
          <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-9998 bg-background/60 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <AlertDialogPrimitive.Popup
            className={cn(
              'fixed top-[50%] left-[50%] z-10000 translate-x-[-50%] translate-y-[-50%]',
              'transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95',
              'w-full max-w-[340px] rounded-xl bg-surface-1 border border-border-default p-5 shadow-2xl'
            )}
          >
            {children}
          </AlertDialogPrimitive.Popup>
        </AlertDialogPortal>
      </AlertDialogRoot>
    </LegacyAlertDialogContext.Provider>
  );
}

interface LegacyAlertDialogTitleProps {
  children: ReactNode;
  icon?: ReactNode;
}

function LegacyAlertDialogTitle({
  children,
  icon,
}: LegacyAlertDialogTitleProps) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-text-muted shrink-0">{icon}</span>}
      <AlertDialogPrimitive.Title className="text-[15px] font-semibold text-foreground">
        {children}
      </AlertDialogPrimitive.Title>
    </div>
  );
}

interface LegacyAlertDialogDescriptionProps {
  children: ReactNode;
}

function LegacyAlertDialogDescription({
  children,
}: LegacyAlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description className="text-[14px] text-text-muted mt-3 leading-relaxed">
      {children}
    </AlertDialogPrimitive.Description>
  );
}

interface LegacyAlertDialogFooterProps {
  children: ReactNode;
}

function LegacyAlertDialogFooter({ children }: LegacyAlertDialogFooterProps) {
  const { onOpenChange, onConfirm } = useLegacyAlertDialogContext();
  const [isConfirming, setIsConfirming] = useState(false);

  // Extract cancel and confirm button text from children
  const childArray = Array.isArray(children) ? children : [children];
  const cancelChild = childArray.find(
    (c: React.ReactElement<{ children: ReactNode }> | null | undefined) =>
      (c?.type as { displayName?: string })?.displayName ===
      'LegacyAlertDialogCancel'
  );
  const confirmChild = childArray.find(
    (c: React.ReactElement<{ children: ReactNode }> | null | undefined) =>
      (c?.type as { displayName?: string })?.displayName ===
      'LegacyAlertDialogConfirm'
  );
  const cancelText =
    (cancelChild as React.ReactElement<{ children: ReactNode }> | undefined)
      ?.props?.children ?? 'Cancel';
  const confirmText =
    (confirmChild as React.ReactElement<{ children: ReactNode }> | undefined)
      ?.props?.children ?? 'Confirm';

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        disabled={isConfirming}
        className="px-4 py-1.5 text-[14px] font-medium text-text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isConfirming}
        className="px-4 py-1.5 text-[14px] font-medium text-text-inverted bg-destructive hover:bg-destructive/90 rounded-lg transition-colors disabled:opacity-50"
      >
        {isConfirming ? 'Please wait...' : confirmText}
      </button>
    </div>
  );
}

interface LegacyAlertDialogButtonProps {
  children: ReactNode;
}

function LegacyAlertDialogCancel(_props: LegacyAlertDialogButtonProps) {
  // This component is just a marker - the actual button is rendered in Footer
  return null;
}
LegacyAlertDialogCancel.displayName = 'LegacyAlertDialogCancel';

function LegacyAlertDialogConfirm(_props: LegacyAlertDialogButtonProps) {
  // This component is just a marker - the actual button is rendered in Footer
  return null;
}
LegacyAlertDialogConfirm.displayName = 'LegacyAlertDialogConfirm';

function LegacyAlertDialogHeader({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

/**
 * Legacy compound AlertDialog component for backward compatibility.
 * Supports the old API: AlertDialog.Header, AlertDialog.Title, etc.
 * with onConfirm prop for confirmation handling.
 */
const AlertDialog = Object.assign(LegacyAlertDialogProvider, {
  Header: LegacyAlertDialogHeader,
  Title: LegacyAlertDialogTitle,
  Description: LegacyAlertDialogDescription,
  Footer: LegacyAlertDialogFooter,
  Cancel: LegacyAlertDialogCancel,
  Confirm: LegacyAlertDialogConfirm,
});

// ============================================================================
// Exports
// ============================================================================

export {
  // Legacy compound component (backward compatibility)
  AlertDialog,
  // New coss/Base UI components
  AlertDialogCreateHandle,
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogBackdrop as AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogPopup as AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
  AlertDialogViewport,
};

export type { LegacyAlertDialogContextValue as AlertDialogContextValue };
