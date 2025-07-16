"use client"
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import V0Hero from "@/components/sections/home/v0-hero";
import { Header } from "@/components/sections/home/header";

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const waitlistCount = useQuery(trpc.earlyAccess.getWaitlistCount.queryOptions());

  console.log(`waitlistCount: ${waitlistCount.data}`);
  console.log(`healthCheck: ${healthCheck.data}`);

  return (

    <div className="bg-landing-background mx-auto w-full">
      <Header />
      <V0Hero />
    </div>
  );
}
