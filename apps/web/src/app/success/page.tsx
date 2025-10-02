import { getServerCustomerState } from '@bounty/auth/server-utils';
import { Card, CardContent } from '@bounty/ui/components/card';
import { Spinner } from '@bounty/ui/components/spinner';
import { Suspense } from 'react';
import { Sidebar } from '@/components/dual-sidebar';
import { SuccessClient } from './success-client';

export default async function SuccessPage() {
  const { data: customerState } = await getServerCustomerState();

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
      <SuccessClient initialCustomerState={customerState} />
    </Suspense>
  );
}
