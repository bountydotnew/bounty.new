import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import * as React from "react";
// import Bounty from '../icons/bounty';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

type DialogOverlayProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Overlay
> & {
  showOverlay?: boolean;
};

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, showOverlay = true, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} {...props} className={cn("fixed inset-0")}>
    <div
      className={cn(
        "absolute inset-0 z-[99]",
        showOverlay ? "bg-black/80" : "bg-black/20",
        className,
      )}
    />
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none z-[98] opacity-[0.025]"
    >
      {/* <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute inset-0 wiggle [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20153%20179%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%2221.3696%22%3E%3Cg%20transform%3D%22scale(0.5)%22%3E%3Cpath%20d%3D%22M91.1385%2071.1097C107.031%2077.947%20125.457%2070.6065%20132.294%2054.7141C139.132%2038.8217%20131.791%2020.3956%20115.899%2013.5582C100.006%206.72079%2081.5803%2014.0613%2074.7429%2029.9537C67.9055%2045.8461%2075.2461%2064.2723%2091.1385%2071.1097ZM91.1385%2071.1097L29.921%2044.7722M5%20102.256L33.9985%20114.732C49.8909%20121.57%2068.317%20114.229%2075.1544%2098.3367C81.9918%2082.4443%2074.6513%2064.0182%2058.7589%2057.1808L29.7603%2044.7048M148.655%2095.8569L119.657%2083.3808C103.764%2076.5434%2085.338%2083.8839%2078.5006%2099.7763L78.5182%20179%22/%3E%3C/g%3E%3C/svg%3E')] [background-size:120px_120px] [background-repeat:repeat] [background-position:60px_60px],url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20153%20179%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%2221.3696%22%3E%3Cg%20transform%3D%22scale(0.5)%22%3E%3Cpath%20d%3D%22M91.1385%2071.1097C107.031%2077.947%20125.457%2070.6065%20132.294%2054.7141C139.132%2038.8217%20131.791%2020.3956%20115.899%2013.5582C100.006%206.72079%2081.5803%2014.0613%2074.7429%2029.9537C67.9055%2045.8461%2075.2461%2064.2723%2091.1385%2071.1097ZM91.1385%2071.1097L29.921%2044.7722M5%20102.256L33.9985%20114.732C49.8909%20121.57%2068.317%20114.229%2075.1544%2098.3367C81.9918%2082.4443%2074.6513%2064.0182%2058.7589%2057.1808L29.7603%2044.7048M148.655%2095.8569L119.657%2083.3808C103.764%2076.5434%2085.338%2083.8839%2078.5006%2099.7763L78.5182%20179%22/%3E%3C/g%3E%3C/svg%3E')] [background-size:120px_120px] [background-repeat:repeat] [background-position:120px_120px]" /> */}
    </div>
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showOverlay?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, showOverlay = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay showOverlay={showOverlay} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[100] translate-x-[-50%] translate-y-[-50%] duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:scale-90 data-[state=open]:scale-100",
        "bg-background w-full max-w-[500px] rounded-xl border p-6",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export type DialogProps = DialogPrimitive.DialogProps;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
