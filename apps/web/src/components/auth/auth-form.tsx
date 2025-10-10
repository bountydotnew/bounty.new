'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useState } from 'react';
import { toast } from 'sonner';

interface AuthFormProps {
  callbackUrl?: string;
}

export default function AuthForm({ callbackUrl }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);

      if (mode === 'signup') {
        await authClient.signUp.email({
          email,
          password,
          name: email.split('@')[0], // Use email prefix as default name
        });

        toast.success('Account created successfully!');
      } else {
        await authClient.signIn.email({
          email,
          password,
        });

        toast.success('Sign in successful!');
      }

      // Use callbackUrl prop for redirect, falling back to '/dashboard'
      window.location.href = callbackUrl || '/dashboard';

    } catch (error: any) {
      toast.error(error?.message || `${mode === 'signup' ? 'Sign up' : 'Sign in'} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {mode === 'signup' ? 'Create account' : 'Welcome back'}
        </h1>
        <p className="text-gray-400 text-sm">
          {mode === 'signup'
            ? 'Enter your email below to create your account'
            : 'Enter your email below to sign in to your account'}
        </p>
      </div>

      <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading
            ? `${mode === 'signup' ? 'Creating account...' : 'Signing in...'}`
            : mode === 'signup'
            ? 'Create account'
            : 'Sign in'}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="text"
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          disabled={isLoading}
          className="text-sm text-gray-400 hover:text-white"
        >
          {mode === 'signup'
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </Button>
      </div>
    </div>
  );
}