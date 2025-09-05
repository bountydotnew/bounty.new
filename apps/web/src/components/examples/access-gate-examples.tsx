'use client';

import { AccessGate } from '@/components/access-gate';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';

/**
 * Example component demonstrating various AccessGate usage patterns
 */
export const AccessGateExamples = () => {
  return (
    <div className="space-y-6 p-6">
      <h2 className="font-bold text-2xl">AccessGate Examples</h2>

      {/* Beta-only feature */}
      <AccessGate stage="beta">
        <Card>
          <CardHeader>
            <CardTitle>Beta Feature</CardTitle>
            <CardDescription>
              This card is only visible to beta users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Beta-only Action</Button>
          </CardContent>
        </Card>
      </AccessGate>

      {/* Alpha or Beta users */}
      <AccessGate stage={['alpha', 'beta']}>
        <Card>
          <CardHeader>
            <CardTitle>Alpha & Beta Feature</CardTitle>
            <CardDescription>
              This is visible to both alpha and beta users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Advanced Action</Button>
          </CardContent>
        </Card>
      </AccessGate>

      {/* Production-only feature with fallback */}
      <AccessGate
        fallback={
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                This feature will be available in production
              </CardDescription>
            </CardHeader>
          </Card>
        }
        stage="production"
      >
        <Card>
          <CardHeader>
            <CardTitle>Production Feature</CardTitle>
            <CardDescription>
              This is only available to production users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Production Action</Button>
          </CardContent>
        </Card>
      </AccessGate>

      {/* Example with additional condition */}
      <AccessGate
        condition={new Date().getDay() === 1}
        fallback={
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle>Monday Beta Feature</CardTitle>
              <CardDescription>
                This feature is only available to beta users on Mondays
              </CardDescription>
            </CardHeader>
          </Card>
        } // Only on Mondays
        stage="beta"
      >
        <Card>
          <CardHeader>
            <CardTitle>Monday Beta Feature</CardTitle>
            <CardDescription>
              Available to beta users on Mondays only!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Monday Action</Button>
          </CardContent>
        </Card>
      </AccessGate>
    </div>
  );
};
