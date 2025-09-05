import { cn } from '@/lib/utils';

export function Divider({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('h-[1px] w-full bg-white/10', className)} {...props} />
  );
}
