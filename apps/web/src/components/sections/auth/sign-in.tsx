import { Eye, EyeOff } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import Analog from '@/components/icons/analog';
import GitHub from '@/components/icons/github';
import Mail0 from '@/components/icons/mail0';
import OnlyFans from '@/components/icons/onlyfans';
import OSS from '@/components/icons/oss';

// --- HELPER COMPONENTS (ICONS) ---

// --- TYPE DEFINITIONS ---

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGitHubSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  onSwitchToSignUp?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-radius border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = (
    <span className="font-light text-foreground tracking-tighter">Welcome</span>
  ),
  description = 'Access your account and continue your journey with us',
  onSignIn,
  onGitHubSignIn,
  onResetPassword,
  onSwitchToSignUp,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full flex-col font-geist md:flex-row">
      {/* Left column: sign-in form */}
      <section className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-delay-100 animate-element font-semibold text-4xl leading-tight md:text-5xl">
              {title}
            </h1>
            <p className="animate-delay-200 animate-element text-muted-foreground">
              {description}
            </p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-delay-300 animate-element">
                <label className="font-medium text-muted-foreground text-sm">
                  Email Address
                </label>
                <GlassInputWrapper>
                  <input
                    className="w-full rounded-radius bg-transparent p-4 text-sm focus:outline-none"
                    name="email"
                    placeholder="Enter your email address"
                    type="email"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-delay-400 animate-element">
                <label className="font-medium text-muted-foreground text-sm">
                  Password
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      className="w-full rounded-radius bg-transparent p-4 pr-12 text-sm focus:outline-none"
                      name="password"
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                    />
                    <button
                      className="absolute inset-y-0 right-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="flex animate-delay-500 animate-element items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    className="custom-checkbox"
                    name="rememberMe"
                    type="checkbox"
                  />
                  <span className="text-foreground/90">Keep me signed in</span>
                </label>
                <a
                  className="text-violet-400 transition-colors hover:underline"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onResetPassword?.();
                  }}
                >
                  Reset password
                </a>
              </div>

              <button
                className="w-full animate-delay-600 animate-element rounded-radius bg-white py-4 font-medium text-black transition-colors hover:bg-primary/90"
                type="submit"
              >
                Sign In
              </button>
            </form>

            <div className="relative flex animate-delay-700 animate-element items-center justify-center">
              <span className="w-full border-border border-t" />
              <span className="absolute bg-background px-4 text-muted-foreground text-sm">
                Or continue with
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                className="flex w-full animate-delay-800 animate-element items-center justify-center gap-3 rounded-radius border border-border py-4 transition-colors hover:bg-secondary"
                onClick={onGitHubSignIn}
              >
                <GitHub className="h-5 w-5 fill-foreground" />
                Continue with GitHub
              </button>
              <button
                className="flex w-full animate-delay-800 animate-element items-center justify-center gap-3 rounded-radius border border-border py-4 transition-colors hover:bg-secondary"
                onClick={() => alert('just kidding lmao')}
              >
                <OnlyFans className="h-5 w-5 fill-foreground" />
                Continue with OnlyFans
              </button>
              {/* <button onClick={() => alert('just kidding lmao')} className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-radius py-4 hover:bg-secondary transition-colors">
                <Wendys className="w-6 h-6 fill-foreground" />
                Continue with Wendy&apos;s
              </button> */}
              <button
                className="flex w-full animate-delay-800 animate-element items-center justify-center gap-3 rounded-radius border border-border py-4 transition-colors hover:bg-secondary"
                onClick={() => alert('just kidding lmao')}
              >
                <OSS className="h-6 w-6 fill-foreground" />
                Continue with oss.now
              </button>
              <button
                className="flex w-full animate-delay-800 animate-element items-center justify-center gap-3 rounded-radius border border-border py-4 transition-colors hover:bg-secondary"
                onClick={() => alert('just kidding lmao')}
              >
                <Mail0 className="h-6 w-6 fill-foreground" />
                Continue with Mail0
              </button>
              <button
                className="flex w-full animate-delay-800 animate-element items-center justify-center gap-3 rounded-radius border border-border py-4 transition-colors hover:bg-secondary"
                onClick={() => alert('just kidding lmao')}
              >
                <Analog className="h-6 w-6 fill-foreground" />
                Continue with Analog
              </button>
            </div>
            <p className="animate-delay-900 animate-element text-center text-muted-foreground text-sm">
              New to our platform?{' '}
              <a
                className="text-violet-400 transition-colors hover:underline"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSwitchToSignUp?.();
                }}
              >
                Create Account
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
