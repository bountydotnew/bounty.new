import Image from "next/image";

import PreviewLight from "@/assets/preview.png";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { trpc } from "@/utils/trpc";
import { WaitlistForm } from "./waitlist-form";
import { Button } from "@/components/ui/button";
import { Discord } from "@/components/icons/discord";
import { Twitter } from "@/components/icons/twitter";
import { ModeToggle } from "@/components/mode-toggle";
import { GitHub } from "@/components/icons/github";

export function Hero() {

    return (
        <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center overflow-hidden">
            {/* Subtle dot background overlay */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(128,128,128,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(181,181,181,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
            <main className="relative z-10 mx-auto flex w-full flex-col items-center justify-center gap-8 text-center py-16 px-4">
                <div className="z-10 flex w-full max-w-4xl flex-col items-center gap-8">
                    <h1 className="z-10 text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl text-foreground leading-[0.85]">
                        Simplified<br />Bounty Creation<br />&amp; Submission
                    </h1>
                    <p className="z-10 mx-auto text-center text-balance text-muted-foreground sm:text-lg">
                        Instantly create bounties. Seamless submissions and payouts with Stripe. <span className="font-medium text-foreground">Launching soon.</span>
                    </p>
                    <WaitlistForm />
                </div>
            </main>
        </div>
    );
}
