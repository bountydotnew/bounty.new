import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from '@/components/ui/link';

interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
}

export function StatCard({ title, value, hint, icon, href }: StatCardProps) {
  return (
    <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-neutral-300 text-sm">
          {icon}
          {title}
          {href && (
            <Link href={href} className="group">
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-neutral-500 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
