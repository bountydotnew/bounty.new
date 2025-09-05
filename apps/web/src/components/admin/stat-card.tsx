import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}





