'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@bounty/ui/lib/utils';

interface AlertDialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error(
      'AlertDialog components must be used within AlertDialogProvider'
    );
  }
  return context;
}

interface AlertDialogProviderProps extends AlertDialogContextValue {
  children: ReactNode;
}

function AlertDialogProvider({
  children,
  ...contextValue
}: AlertDialogProviderProps) {
  return (
    <AlertDialogContext.Provider value={contextValue}>
      <DialogPrimitive.Root
        open={contextValue.open}
        onOpenChange={contextValue.onOpenChange}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-9998 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className={cn(
              'fixed top-[50%] left-[50%] z-10000 translate-x-[-50%] translate-y-[-50%]',
              'data-[state=closed]:animate-out data-[state=open]:animate-in',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'w-full max-w-[340px] rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-5 shadow-2xl',
              'duration-200'
            )}
          >
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </AlertDialogContext.Provider>
  );
}

interface AlertDialogTitleProps {
  children: ReactNode;
  icon?: ReactNode;
}

function AlertDialogTitle({ children, icon }: AlertDialogTitleProps) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-[#888] shrink-0">{icon}</span>}
      <h3 className="text-[15px] font-semibold text-white">{children}</h3>
    </div>
  );
}

interface AlertDialogDescriptionProps {
  children: ReactNode;
}

function AlertDialogDescription({ children }: AlertDialogDescriptionProps) {
  return (
    <p className="text-[14px] text-[#888] mt-3 leading-relaxed">{children}</p>
  );
}

interface AlertDialogFooterProps {
  children: ReactNode;
}

function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  const { onOpenChange, onConfirm } = useAlertDialogContext();
  const [isConfirming, setIsConfirming] = useState(false);

  // Extract cancel and confirm button text from children
  const childArray = Array.isArray(children) ? children : [children];
  const cancelChild = childArray.find(
    (c: React.ReactElement<{ children: ReactNode }> | null | undefined) =>
      (c?.type as { displayName?: string })?.displayName === 'AlertDialogCancel'
  );
  const confirmChild = childArray.find(
    (c: React.ReactElement<{ children: ReactNode }> | null | undefined) =>
      (c?.type as { displayName?: string })?.displayName ===
      'AlertDialogConfirm'
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
        className="px-4 py-1.5 text-[14px] font-medium text-[#888] hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors disabled:opacity-50"
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isConfirming}
        className="px-4 py-1.5 text-[14px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
      >
        {isConfirming ? 'Please wait...' : confirmText}
      </button>
    </div>
  );
}

interface AlertDialogButtonProps {
  children: ReactNode;
}

function AlertDialogCancel(_props: AlertDialogButtonProps) {
  // This component is just a marker - the actual button is rendered in Footer
  return null;
}
AlertDialogCancel.displayName = 'AlertDialogCancel';

function AlertDialogConfirm(_props: AlertDialogButtonProps) {
  // This component is just a marker - the actual button is rendered in Footer
  return null;
}
AlertDialogConfirm.displayName = 'AlertDialogConfirm';

function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export const AlertDialog = Object.assign(AlertDialogProvider, {
  Header: AlertDialogHeader,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Footer: AlertDialogFooter,
  Cancel: AlertDialogCancel,
  Confirm: AlertDialogConfirm,
});

export type { AlertDialogContextValue };
