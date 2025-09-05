import { BackedByBadge } from '@/components/ui/backed-by-badge';
import { ConditionalForm } from './conditional-form';

export function Hero() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      {/* Subtle dot background overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(128,128,128,0.08)_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[radial-gradient(circle,rgba(181,181,181,0.08)_1px,transparent_1px)]" />
      <main className="relative z-10 mx-auto flex w-full flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <div className="z-10 flex w-full max-w-4xl flex-col items-center gap-8">
          <BackedByBadge />
          <h1 className="z-10 font-bold text-5xl text-foreground leading-[0.85] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Simplified
            <br />
            Bounty Creation
            <br />
            &amp; Submission
          </h1>
          <p className="z-10 mx-auto text-balance text-center text-muted-foreground sm:text-lg">
            Instantly create bounties. Seamless submissions and payouts with
            Stripe.{' '}
            <span className="font-medium text-foreground">Launching soon.</span>
          </p>
          <ConditionalForm />
        </div>
      </main>
    </div>
  );
}
