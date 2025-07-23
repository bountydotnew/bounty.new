import { cn } from "@/lib/utils";

export function Divider({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full h-[1px] bg-white/10", className)}
      {...props}
    />
  )
}