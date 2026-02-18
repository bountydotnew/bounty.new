import type { Metadata } from 'next';
import { Card, CardContent } from '@bounty/ui/components/card';
import { Spinner } from '@bounty/ui/components/spinner';
import { Suspense } from 'react';
import { Sidebar } from '@/components/dual-sidebar';
import { SuccessClient } from './success-client';

export const metadata: Metadata = {
  title: 'Success',
  description: 'Your action was completed successfully.',
};

export const dynamic = 'force-dynamic';

export default async function SuccessPage() {
  return (
    <Suspense
      fallback={
        <Sidebar>
          <div className="container mx-auto py-8">
            <Card>
              <CardContent className="p-6">
                <Spinner />
              </CardContent>
            </Card>
          </div>
        </Sidebar>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
