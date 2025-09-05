import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, hint, icon }: StatCardProps) {
  return (
    <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-neutral-300 text-sm">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-neutral-500 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
