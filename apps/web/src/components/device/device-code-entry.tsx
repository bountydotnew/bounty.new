'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Input } from '@bounty/ui/components/input';
import { Spinner } from '@bounty/ui/components/spinner';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface DeviceCodeEntryProps {
  initialCode?: string;
}

const normalizeCode = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

const formatForDisplay = (value: string) => {
  const normalized = normalizeCode(value);
  if (!normalized) {
    return '';
  }

  return normalized.match(/.{1,4}/g)?.join('-') ?? normalized;
};

export function DeviceCodeEntry({ initialCode = '' }: DeviceCodeEntryProps) {
  const router = useRouter();
  const normalizedInitial = useMemo(
    () => normalizeCode(initialCode),
    [initialCode]
  );
  const [inputValue, setInputValue] = useState(() =>
    formatForDisplay(normalizedInitial)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputId = useId();

  useEffect(() => {
    setInputValue(formatForDisplay(normalizedInitial));
  }, [normalizedInitial]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInputValue(formatForDisplay(nextValue));
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitizedCode = normalizeCode(inputValue);

    if (!sanitizedCode || sanitizedCode.length < 6) {
      setError('Enter a valid device code.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authClient.device({
        query: { user_code: sanitizedCode },
      });

      if (!response.data) {
        throw new Error(response.error?.error_description || 'Invalid code.');
      }

      toast.success('Code verified. Continue on your primary device.');
      router.push(`/device/approve?user_code=${sanitizedCode}`);
      setIsSubmitting(false);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to verify the device code.';
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="border border-muted bg-background text-foreground">
        <CardHeader>
          <CardTitle className="font-semibold text-2xl">
            Authorize a device
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Enter the code shown in your extension or CLI to connect it to your
            bounty.new account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="block font-medium text-muted-foreground text-sm"
                htmlFor={inputId}
              >
                Device code
              </label>
              <Input
                aria-label="Device authorization code"
                className="h-12 rounded-lg border border-neutral-700 bg-neutral-900 text-lg tracking-[0.4rem] placeholder:text-neutral-500"
                id={inputId}
                maxLength={19}
                onChange={handleChange}
                placeholder="ABCD-1234"
                value={inputValue}
              />
              {error && (
                <p className="text-red-400 text-sm" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="h-11 rounded-lg bg-primary text-primary-foreground"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Verifying…
                  </span>
                ) : (
                  'Continue'
                )}
              </Button>
              <p className="text-muted-foreground text-xs">
                You&apos;ll be asked to approve the request after we confirm the
                code.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
