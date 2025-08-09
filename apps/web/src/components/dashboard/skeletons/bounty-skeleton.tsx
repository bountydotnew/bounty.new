import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface BountySkeletonProps {
  count?: number;
}

export function BountySkeleton({ count = 1 }: BountySkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="flex items-center gap-2">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-12"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-4"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function SimpleBountySkeleton({ count = 3 }: BountySkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function BountyDetailSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-8 w-20 bg-muted rounded" />
        <div className="h-8 w-28 bg-muted rounded" />
      </div>
      <div className="h-8 bg-muted rounded w-3/4 mb-4" />
      <div className="space-y-3 mb-6">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-5 bg-muted rounded w-32" />
        <div className="h-20 bg-muted rounded" />
        <div className="h-5 bg-muted rounded w-40" />
        <div className="h-24 bg-muted rounded" />
      </div>
    </div>
  );
}