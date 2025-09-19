'use client';

import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { Switch } from '@bounty/ui/components/switch';
import { Copy, ExternalLink, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PaymentButton } from '@/components/payment/payment-button';

export function PaymentSettings() {
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [presetAmounts, setPresetAmounts] = useState([5, 10, 25, 50]);
  const [newAmount, setNewAmount] = useState('');
  const [allowCustomAmount, setAllowCustomAmount] = useState(true);
  const [minAmount, setMinAmount] = useState(1);
  const [maxAmount, setMaxAmount] = useState(1000);

  // Mock user data - in real implementation this would come from API
  const username = 'johndoe';
  const apiKey = 'pk_test_123456789';

  const handleAddPresetAmount = () => {
    const amount = Number.parseFloat(newAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (presetAmounts.includes(amount)) {
      toast.error('This amount already exists');
      return;
    }

    if (presetAmounts.length >= 6) {
      toast.error('Maximum 6 preset amounts allowed');
      return;
    }

    setPresetAmounts([...presetAmounts, amount].sort((a, b) => a - b));
    setNewAmount('');
    toast.success('Preset amount added');
  };

  const handleRemovePresetAmount = (amount: number) => {
    setPresetAmounts(presetAmounts.filter((a) => a !== amount));
    toast.success('Preset amount removed');
  };

  const generateHTMLSnippet = () => {
    return `
    <br>
    <div style="display: flex; width: 100%; justify-content: flex-end;">
      <a href="https://bounty.new/pay/${username}">
        <img alt="Pay with Bounty.new" src="https://bounty.new/github/bounty.svg" />
      </a>
    </div>
    <br>
    `;
  };

  const copyHTMLSnippet = () => {
    navigator.clipboard.writeText(generateHTMLSnippet());
    toast.success('HTML snippet copied to clipboard!');
  };

  const copyDirectLink = () => {
    const link = `https://bounty.new/pay/${username}`;
    navigator.clipboard.writeText(link);
    toast.success('Direct link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Payment Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Button</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label
                className="font-medium text-base"
                htmlFor="payment-enabled"
              >
                Enable Payment Button
              </Label>
              <p className="text-muted-foreground text-sm">
                Allow others to send you payments via GitHub PRs and other
                platforms
              </p>
            </div>
            <Switch
              checked={paymentEnabled}
              id="payment-enabled"
              onCheckedChange={setPaymentEnabled}
            />
          </div>

          {paymentEnabled && (
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-muted-foreground text-sm">
                Payment processing is not yet implemented. This is UI-only for
                now.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {paymentEnabled && (
        <>
          {/* Preset Amounts */}
          <Card>
            <CardHeader>
              <CardTitle>Preset Amounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block font-medium text-sm">
                  Current presets
                </Label>
                <div className="flex flex-wrap gap-2">
                  {presetAmounts.map((amount) => (
                    <Badge
                      className="flex items-center gap-1"
                      key={amount}
                      variant="secondary"
                    >
                      ${amount}
                      <button
                        className="ml-1 hover:text-red-600"
                        onClick={() => handleRemovePresetAmount(amount)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  className="w-24"
                  max="10000"
                  min="1"
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="25"
                  type="number"
                  value={newAmount}
                />
                <Button
                  disabled={presetAmounts.length >= 6}
                  onClick={handleAddPresetAmount}
                  size="sm"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Add up to 6 preset amounts that users can quickly select
              </p>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    className="font-medium text-base"
                    htmlFor="allow-custom"
                  >
                    Allow Custom Amounts
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Let users enter their own payment amount
                  </p>
                </div>
                <Switch
                  checked={allowCustomAmount}
                  id="allow-custom"
                  onCheckedChange={setAllowCustomAmount}
                />
              </div>

              {allowCustomAmount && (
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-background p-4">
                  <div>
                    <Label className="font-medium text-sm" htmlFor="min-amount">
                      Minimum Amount
                    </Label>
                    <Input
                      disabled
                      id="min-amount"
                      max="100"
                      min="1"
                      onChange={(e) =>
                        setMinAmount(Number.parseInt(e.target.value, 10) || 1)
                      }
                      type="number"
                      value={minAmount}
                    />
                  </div>
                  <div>
                    <Label className="font-medium text-sm" htmlFor="max-amount">
                      Maximum Amount
                    </Label>
                    <Input
                      disabled
                      id="max-amount"
                      max="10000"
                      min="1"
                      onChange={(e) =>
                        setMaxAmount(
                          Number.parseInt(e.target.value, 10) || 1000
                        )
                      }
                      type="number"
                      value={maxAmount}
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">
                      Custom amount limits are not yet configurable
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block font-medium text-sm">
                  Button Preview
                </Label>
                <div className="rounded-lg border border-border bg-background p-4">
                  <PaymentButton apiKey={apiKey} username={username} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HTML Snippet */}
          <Card>
            <CardHeader>
              <CardTitle>Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block font-medium text-sm">
                  GitHub HTML Snippet
                </Label>
                <p className="mb-2 text-muted-foreground text-sm">
                  Copy this HTML code to embed the payment button in GitHub PRs,
                  issues, or README files
                </p>
                <div className="relative">
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-xs">
                    <code>{generateHTMLSnippet()}</code>
                  </pre>
                  <Button
                    className="absolute top-2 right-2"
                    onClick={copyHTMLSnippet}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="mt-2 rounded-lg border border-border bg-background p-3">
                  <p className="text-muted-foreground text-xs">
                    💡 This creates a right-aligned payment button using the
                    official Bounty.new badge image
                  </p>
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-medium text-sm">
                  Direct Payment Link
                </Label>
                <p className="mb-2 text-muted-foreground text-sm">
                  Share this direct link to your payment page
                </p>
                <div className="flex gap-2">
                  <Input
                    className="font-mono text-xs"
                    readOnly
                    value={`https://bounty.new/pay/${username}`}
                  />
                  <Button onClick={copyDirectLink} size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`/pay/${username}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
