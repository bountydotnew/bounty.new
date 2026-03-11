'use client';

/**
 * Test component for autumn-js SDK integration
 * Tests the useCustomer hook and AutumnProvider setup
 */

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
import { Loader2, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useCustomer } from 'autumn-js/react';

function SdkStatusCard({
  isLoading,
  error,
  customer,
  refetch,
}: {
  isLoading: boolean;
  error: Error | null;
  customer: any;
  refetch: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          autumn-js SDK Status
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Testing the AutumnProvider and useCustomer hook integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {error ? (
            <>
              <X className="h-5 w-5 text-red-500" />
              <span className="text-red-500">SDK Error: {error.message}</span>
            </>
          ) : customer ? (
            <>
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-green-500">
                SDK Connected - Customer loaded
              </span>
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">
                Loading customer data...
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-yellow-500">
                No customer found - complete checkout to create one
              </span>
            </>
          )}
        </div>

        {customer && (
          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Customer ID:</span>
              <code className="rounded bg-background px-2 py-1 text-xs">
                {customer.id ?? 'N/A'}
              </code>
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
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Products:</span>
              <span>{customer.products?.length ?? 0}</span>
            </div>
          </div>
        )}

        {customer && customer.products && customer.products.length > 0 && (
          <div className="space-y-2">
            <Label>Active Products</Label>
            <div className="space-y-2">
              {customer.products.map((product: any) => (
                <div key={product.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {product.name || product.id}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Status:{' '}
                        <Badge variant="outline" className="text-xs">
                          {product.status}
                        </Badge>
                      </p>
                    </div>
                    <Badge
                      variant={
                        product.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {product.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {customer &&
          customer.features &&
          Object.keys(customer.features).length > 0 && (
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="space-y-2">
                {Object.entries(customer.features).map(
                  ([key, feature]: [string, any]) => (
                    <div key={key} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{key}</p>
                        <Badge
                          variant={feature.enabled ? 'default' : 'secondary'}
                        >
                          {feature.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Usage: {feature.usage ?? 0}</div>
                        <div>Balance: {feature.balance ?? 'N/A'}</div>
                        {feature.included_usage !== undefined && (
                          <div>Included: {feature.included_usage}</div>
                        )}
                        {feature.unlimited && (
                          <div className="col-span-2">Unlimited</div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}

function SdkFeatureCheckCard({
  featureId,
  setFeatureId,
  customer,
  handleCheck,
  checkResult,
}: {
  featureId: string;
  setFeatureId: (value: string) => void;
  customer: any;
  handleCheck: () => void;
  checkResult: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Feature Check (SDK)</CardTitle>
        <CardDescription>
          Test the check() method from useCustomer hook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="sdkFeatureId">Feature ID</Label>
            <Input
              id="sdkFeatureId"
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
              placeholder="concurrent_bounties"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCheck} disabled={!customer}>
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
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(checkResult.data, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SdkProductAttachCard({
  productId,
  setProductId,
  customer,
  handleAttach,
  attachResult,
}: {
  productId: string;
  setProductId: (value: string) => void;
  customer: any;
  handleAttach: () => void;
  attachResult: any;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Product Attach (SDK)</CardTitle>
        <CardDescription>
          Test the attach() method - initiates checkout flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="sdkProductId">Product ID</Label>
            <Input
              id="sdkProductId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="tier_2_pro"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAttach} disabled={!customer}>
              Attach Product
            </Button>
          </div>
        </div>

        {attachResult && (
          <div className="rounded-lg border p-4">
            {attachResult.error ? (
              <div className="flex items-start gap-2 text-red-500">
                <X className="h-5 w-5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{attachResult.error}</p>
                </div>
              </div>
            ) : attachResult.data ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <p className="font-medium">Success</p>
                </div>
                {'checkout_url' in attachResult.data &&
                attachResult.data.checkout_url ? (
                  <p className="text-sm text-muted-foreground">
                    Redirecting to checkout...
                  </p>
                ) : (
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                    {JSON.stringify(attachResult.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SdkUsageTrackCard({
  featureId,
  setFeatureId,
  customer,
  handleTrack,
}: {
  featureId: string;
  setFeatureId: (value: string) => void;
  customer: any;
  handleTrack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Usage Track (SDK)</CardTitle>
        <CardDescription>
          Test the track() method - increments feature usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="sdkTrackFeature">Feature ID</Label>
            <Input
              id="sdkTrackFeature"
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
              placeholder="concurrent_bounties"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleTrack}
              disabled={!customer}
              variant="outline"
            >
              Track Usage (+1)
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This will increment the usage counter for the specified feature.
        </p>
      </CardContent>
    </Card>
  );
}

export function TestAutumnSdk() {
  const [featureId, setFeatureId] = useState('concurrent_bounties');
  const [productId, setProductId] = useState('tier_2_pro');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [attachResult, setAttachResult] = useState<any>(null);

  const { customer, isLoading, error, refetch, attach, check, track } =
    useCustomer();

  const handleCheck = async () => {
    setCheckResult(null);
    try {
      const result = check({
        featureId,
        requiredBalance: 1,
        withPreview: true,
      });
      setCheckResult({ data: result, error: null });
    } catch (err: unknown) {
      setCheckResult({ data: null, error: String(err) });
    }
  };

  const handleAttach = async () => {
    setAttachResult(null);
    try {
      const result = await attach({
        productId,
      });
      if (result.error) {
        setAttachResult({ data: null, error: result.error.message });
      } else {
        setAttachResult({ data: result.data, error: null });
        if ('checkout_url' in result.data && result.data.checkout_url) {
          window.location.href = result.data.checkout_url;
        }
      }
    } catch (err: unknown) {
      setAttachResult({ data: null, error: String(err) });
    }
  };

  const handleTrack = async () => {
    try {
      const result = await track({
        featureId,
        value: 1,
      });
      if (result.error) {
        console.error('Track error:', result.error);
        alert(`Track failed: ${result.error.message}`);
      } else {
        alert('Track successful! Check customer data for updated usage.');
        refetch();
      }
    } catch (err: unknown) {
      console.error('Track error:', err);
      alert(`Track failed: ${String(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <SdkStatusCard
        isLoading={isLoading}
        error={error}
        customer={customer}
        refetch={refetch}
      />
      <SdkFeatureCheckCard
        featureId={featureId}
        setFeatureId={setFeatureId}
        customer={customer}
        handleCheck={handleCheck}
        checkResult={checkResult}
      />
      <SdkProductAttachCard
        productId={productId}
        setProductId={setProductId}
        customer={customer}
        handleAttach={handleAttach}
        attachResult={attachResult}
      />
      <SdkUsageTrackCard
        featureId={featureId}
        setFeatureId={setFeatureId}
        customer={customer}
        handleTrack={handleTrack}
      />
    </div>
  );
}
