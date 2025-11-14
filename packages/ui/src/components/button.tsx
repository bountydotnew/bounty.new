import { cn } from '@bounty/ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot as SlotPrimitive } from 'radix-ui';
import * as React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]',
        text: 'rounded-none bg-transparent p-0 hover:text-muted-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        hotkey:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? SlotPrimitive.Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

interface HotkeyButtonProps extends Omit<ButtonProps, 'variant'> {
  hotkey: string;
}

const HotkeyButton = React.forwardRef<HTMLButtonElement, HotkeyButtonProps>(
  ({ hotkey, children, className, size = 'default', ...props }, ref) => {
    return (
      <Button
        className={cn('pr-2 pl-3', className)}
        ref={ref}
        size={size}
        variant="hotkey"
        {...props}
      >
        <span className="mr-1">{children}</span>
        <kbd className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/20 bg-[#cbcbcb] px-1.5 font-medium text-[15px]">
          {hotkey}
        </kbd>
      </Button>
    );
  }
);
HotkeyButton.displayName = 'HotkeyButton';

export { Button, buttonVariants, HotkeyButton };
