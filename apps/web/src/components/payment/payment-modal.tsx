"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, Heart } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientUsername: string;
  presetAmounts?: number[];
  allowCustomAmount?: boolean;
}

export function PaymentModal({
  open,
  onOpenChange,
  recipientName,
  recipientUsername,
  presetAmounts = [5, 10, 25, 50],
  allowCustomAmount = true,
}: PaymentModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getSelectedAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseFloat(customAmount);
    return 0;
  };

  const handlePayment = async () => {
    const amount = getSelectedAmount();
    
    if (!amount || amount <= 0) {
      toast.error("Please select or enter a valid amount");
      return;
    }

    setIsProcessing(true);
    
    // TODO: Implement actual payment processing
    // For now, just simulate processing
    setTimeout(() => {
      toast.success(`Payment of $${amount} sent to ${recipientName}!`);
      setIsProcessing(false);
      onOpenChange(false);
      
      // Reset form
      setSelectedAmount(null);
      setCustomAmount("");
      setMessage("");
    }, 2000);
  };

  const isValidAmount = () => {
    const amount = getSelectedAmount();
    return amount > 0 && amount <= 10000; // Max $10,000
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background" showOverlay>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <DialogTitle>Support {recipientName}</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Send a tip to @{recipientUsername} for their contribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preset Amounts */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick amounts</Label>
            <div className="grid grid-cols-2 gap-2">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  className="h-12 text-base font-semibold"
                  onClick={() => handlePresetSelect(amount)}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  {amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          {allowCustomAmount && (
            <div>
              <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
                Custom amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-9"
                  min="1"
                  max="10000"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Optional Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium mb-2 block">
              Message (optional)
            </Label>
            <textarea
              id="message"
              placeholder="Thanks for the great work!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-20 text-sm"
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/200 characters
            </div>
          </div>

          {/* Amount Summary */}
          {getSelectedAmount() > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">${getSelectedAmount().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={!isValidAmount() || isProcessing}
            className="min-w-24"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing
              </div>
            ) : (
              `Send $${getSelectedAmount().toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}