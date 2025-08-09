"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PaymentButton } from "@/components/payment/payment-button";
import { Copy, ExternalLink, Plus, X } from "lucide-react";
import { toast } from "sonner";

export function PaymentSettings() {
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [presetAmounts, setPresetAmounts] = useState([5, 10, 25, 50]);
  const [newAmount, setNewAmount] = useState("");
  const [allowCustomAmount, setAllowCustomAmount] = useState(true);
  const [minAmount, setMinAmount] = useState(1);
  const [maxAmount, setMaxAmount] = useState(1000);

  // Mock user data - in real implementation this would come from API
  const username = "johndoe";
  const apiKey = "pk_test_123456789";

  const handleAddPresetAmount = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (presetAmounts.includes(amount)) {
      toast.error("This amount already exists");
      return;
    }

    if (presetAmounts.length >= 6) {
      toast.error("Maximum 6 preset amounts allowed");
      return;
    }

    setPresetAmounts([...presetAmounts, amount].sort((a, b) => a - b));
    setNewAmount("");
    toast.success("Preset amount added");
  };

  const handleRemovePresetAmount = (amount: number) => {
    setPresetAmounts(presetAmounts.filter(a => a !== amount));
    toast.success("Preset amount removed");
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
    toast.success("HTML snippet copied to clipboard!");
  };

  const copyDirectLink = () => {
    const link = `https://bounty.new/pay/${username}`;
    navigator.clipboard.writeText(link);
    toast.success("Direct link copied to clipboard!");
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
              <Label htmlFor="payment-enabled" className="text-base font-medium">
                Enable Payment Button
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow others to send you payments via GitHub PRs and other platforms
              </p>
            </div>
            <Switch
              id="payment-enabled"
              checked={paymentEnabled}
              onCheckedChange={setPaymentEnabled}
            />
          </div>

          {paymentEnabled && (
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Payment processing is not yet implemented. This is UI-only for now.
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
                <Label className="text-sm font-medium mb-2 block">Current presets</Label>
                <div className="flex flex-wrap gap-2">
                  {presetAmounts.map((amount) => (
                    <Badge key={amount} variant="secondary" className="flex items-center gap-1">
                      ${amount}
                      <button
                        onClick={() => handleRemovePresetAmount(amount)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="25"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-24"
                  min="1"
                  max="10000"
                />
                <Button
                  onClick={handleAddPresetAmount}
                  size="sm"
                  disabled={presetAmounts.length >= 6}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
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
                  <Label htmlFor="allow-custom" className="text-base font-medium">
                    Allow Custom Amounts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Let users enter their own payment amount
                  </p>
                </div>
                <Switch
                  id="allow-custom"
                  checked={allowCustomAmount}
                  onCheckedChange={setAllowCustomAmount}
                />
              </div>

              {allowCustomAmount && (
                <div className="grid grid-cols-2 gap-4 bg-background p-4 rounded-lg">
                  <div>
                    <Label htmlFor="min-amount" className="text-sm font-medium">
                      Minimum Amount
                    </Label>
                    <Input
                      id="min-amount"
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(parseInt(e.target.value) || 1)}
                      min="1"
                      max="100"
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-amount" className="text-sm font-medium">
                      Maximum Amount
                    </Label>
                    <Input
                      id="max-amount"
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(parseInt(e.target.value) || 1000)}
                      min="1"
                      max="10000"
                      disabled
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
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
                <Label className="text-sm font-medium mb-2 block">Button Preview</Label>
                <div className="p-4 bg-background border border-border rounded-lg">
                  <PaymentButton username={username} apiKey={apiKey} />
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
                <Label className="text-sm font-medium mb-2 block">GitHub HTML Snippet</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Copy this HTML code to embed the payment button in GitHub PRs, issues, or README files
                </p>
                <div className="relative">
                  <pre className="bg-background border border-border p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    <code>{generateHTMLSnippet()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyHTMLSnippet}
                    className="absolute top-2 right-2"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-background border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    💡 This creates a right-aligned payment button using the official Bounty.new badge image
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Direct Payment Link</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Share this direct link to your payment page
                </p>
                <div className="flex gap-2">
                  <Input
                    value={`https://bounty.new/pay/${username}`}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={copyDirectLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`/pay/${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
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