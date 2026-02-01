import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import Link from '@bounty/ui/components/link';
import { ArrowRight } from 'lucide-react';
import type { StatCardProps } from '@/types/admin';

export function StatCard({ title, value, hint, icon, href }: StatCardProps) {
  return (
    <Card className="border border-neutral-800 bg-surface-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-neutral-300 text-sm">
          {icon}
          {title}
          {href && (
            <Link className="group" href={href}>
              <ArrowRight className="h-4 w-4 text-neutral-400 transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-semibold text-neutral-100 text-xl tracking-tight">
          {value}
        </div>
        {hint && <p className="mt-1 text-neutral-500 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
