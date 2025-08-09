"use client";

import { AccessGate } from "@/components/access-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Example component demonstrating various AccessGate usage patterns
 */
export function AccessGateExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">AccessGate Examples</h2>
      
      {/* Beta-only feature */}
      <AccessGate stage="beta">
        <Card>
          <CardHeader>
            <CardTitle>Beta Feature</CardTitle>
            <CardDescription>This card is only visible to beta users</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Beta-only Action</Button>
          </CardContent>
        </Card>
      </AccessGate>

      {/* Alpha or Beta users */}
      <AccessGate stage={["alpha", "beta"]}>
        <Card>
          <CardHeader>
            <CardTitle>Alpha & Beta Feature</CardTitle>
            <CardDescription>This is visible to both alpha and beta users</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Advanced Action</Button>
          </CardContent>
        </Card>
      </AccessGate>

      {/* Production-only feature with fallback */}
      <AccessGate 
        stage="production"
        fallback={
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>This feature will be available in production</CardDescription>
            </CardHeader>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Production Feature</CardTitle>
            <CardDescription>This is only available to production users</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Production Action</Button>
          </CardContent>
        </Card>
      </AccessGate>

      {/* Example with additional condition */}
      <AccessGate 
        stage="beta" 
        condition={new Date().getDay() === 1} // Only on Mondays
        fallback={
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle>Monday Beta Feature</CardTitle>
              <CardDescription>This feature is only available to beta users on Mondays</CardDescription>
            </CardHeader>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Monday Beta Feature</CardTitle>
            <CardDescription>Available to beta users on Mondays only!</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Monday Action</Button>
          </CardContent>
        </Card>
      </AccessGate>
    </div>
  );
}
