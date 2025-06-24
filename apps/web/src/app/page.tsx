"use client"
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useAccess } from "@/lib/hooks/use-access";
import { user } from "../../../server/src/db/schema/auth";
import { Footer } from "@/components/sections/home/footer";
import { Header } from "@/components/sections/home/header";
import { Hero } from "@/components/sections/home/hero";
import { Button } from "@/components/ui/button";
import { GitHub } from "@/components/icons/github";
import { Twitter } from "@/components/icons/twitter";
import { Discord } from "@/components/icons/discord";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const waitlistCount = useQuery(trpc.earlyAccess.getWaitlistCount.queryOptions());

  console.log(`waitlistCount: ${waitlistCount.data}`);
  console.log(`healthCheck: ${healthCheck.data}`);

  return (

    <div className="bg-landing-background mx-auto w-full">
      <Header />
      <Hero />
      <Footer />
    </div>
  );
}
