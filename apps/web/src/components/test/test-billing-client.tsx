'use client';

import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { Loader2, RefreshCw, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

export function TestBillingClient() {
  const queryClient = useQueryClient();
  const [featureId, setFeatureId] = useState('concurrent_bounties');
  const [trackValue, setTrackValue] = useState(1);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [trackResult, setTrackResult] = useState<any>(null);

  // Get all billing test data
  const { data: testData, isLoading, refetch } = useQuery(trpc.billing.testBilling.queryOptions());

  // Track feature mutation
  const trackFeatureMutation = useMutation(
    trpc.billing.trackFeature.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    })
  );

  // Check feature (use fetchQuery since it's a .query() with dynamic input)
  const handleCheck = async () => {
    setCheckResult(null);
    try {
      const result = await queryClient.fetchQuery(trpc.billing.checkFeature.queryOptions({ featureId }));
      setCheckResult({ data: result, error: null });
    } catch (err: unknown) {
      setCheckResult({ data: null, error: String(err) });
    }
  };

  // Track feature
  const handleTrack = async () => {
    setTrackResult(null);
    try {
      const result = await trackFeatureMutation.mutateAsync({
        featureId,
        value: trackValue,
      });
      setTrackResult({ data: result, error: null });
    } catch (err: unknown) {
      setTrackResult({ data: null, error: String(err) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const customer = testData?.customer;
  const subscriptions = testData?.activeProducts ?? [];
  const features = testData?.features ?? {};
  const products = testData?.products ?? [];

  return (
    <div className="space-y-6">
      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Your Autumn customer profile</CardDescription>
        </CardHeader>
        <CardContent>
          {customer ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Customer ID:</span>
                <code className="rounded bg-muted px-2 py-1 text-xs">{customer.id}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{customer.email ?? 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span>{customer.name ?? 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant="outline">{customer.env ?? 'unknown'}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No customer found. You may need to complete a checkout first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Your current active products</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active subscriptions</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sub.product_id}</p>
                      <p className="text-muted-foreground text-sm">
                        Status: {sub.status}
                      </p>
                    </div>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Status */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Access</CardTitle>
          <CardDescription>Your current feature limits and usage</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(features).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No features available. Subscribe to a plan to unlock features.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(features).map(([key, feature]) => {
                const f = feature as unknown as {
                  enabled?: boolean;
                  type?: string;
                  balance?: number;
                  usage?: number;
                  included_usage?: number;
                  next_reset_at?: number | string;
                };
                return (
                  <div key={key} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">{key}</h4>
                      <Badge variant={f.enabled ? 'default' : 'secondary'}>
                        {f.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>{' '}
                        {f.type}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Balance:</span>{' '}
                        {f.balance ?? 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Usage:</span>{' '}
                        {f.usage ?? 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Included:</span>{' '}
                        {f.included_usage ?? 'N/A'}
                      </div>
                      {f.next_reset_at && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Resets:</span>{' '}
                          {new Date(f.next_reset_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Products */}
      <Card>
        <CardHeader>
          <CardTitle>Available Products</CardTitle>
          <CardDescription>All available products you can subscribe to</CardDescription>
        </CardHeader>
        <CardContent>
          {!Array.isArray(products) || products.length === 0 ? (
            <p className="text-muted-foreground text-sm">No products available</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product: any) => (
                <div key={product.id} className="rounded-lg border p-3">
                  <p className="font-medium">{product.name || product.id}</p>
                  <p className="text-muted-foreground text-sm">
                    {product.description ?? 'No description'}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {product.env ?? 'unknown'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Check Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test Feature Check</CardTitle>
          <CardDescription>
            Check if you have access to a feature and view current balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="featureId">Feature ID</Label>
              <Input
                id="featureId"
                value={featureId}
                onChange={(e) => setFeatureId(e.target.value)}
                placeholder="concurrent_bounties"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCheck}>
                Check
              </Button>
            </div>
          </div>

          {checkResult && (
            <div className="rounded-lg border p-4">
              {checkResult.error ? (
                <div className="flex items-start gap-2 text-red-500">
                  <X className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{checkResult.error}</p>
                  </div>
                </div>
              ) : checkResult.data ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {checkResult.data.allowed ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                    <p className="font-medium">
                      {checkResult.data.allowed ? 'Allowed' : 'Not Allowed'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Balance:</span>{' '}
                      {checkResult.data.balance}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usage:</span>{' '}
                      {checkResult.data.usage}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Track Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test Feature Tracking</CardTitle>
          <CardDescription>
            Track usage for a feature (increments usage counter)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="trackFeature">Feature ID</Label>
              <Input
                id="trackFeature"
                value={featureId}
                onChange={(e) => setFeatureId(e.target.value)}
                placeholder="concurrent_bounties"
              />
            </div>
            <div className="w-24">
              <Label htmlFor="trackValue">Value</Label>
              <Input
                id="trackValue"
                type="number"
                value={trackValue}
                onChange={(e) => setTrackValue(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleTrack}>
                Track
              </Button>
            </div>
          </div>

          {trackResult && (
            <div className="rounded-lg border p-4">
              {trackResult.error ? (
                <div className="flex items-start gap-2 text-red-500">
                  <X className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{trackResult.error}</p>
                  </div>
                </div>
              ) : trackResult.data ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <p className="font-medium">Tracked Successfully</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">New Balance:</span>{' '}
                    {trackResult.data.balance}
                  </div>
                  <div>
                    <span className="text-muted-foreground">New Usage:</span>{' '}
                    {trackResult.data.usage}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Calculation Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Calculation Scenarios</CardTitle>
          <CardDescription>
            Example fee calculations for different monthly spend amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testData?.feeScenarios?.map((scenario: any, i: number) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">${scenario.monthlySpend}/mo spend</span>
                  <Badge variant="outline">Tier {i + 1}</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {scenario.expected}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={() => refetch()} variant="outline" size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
