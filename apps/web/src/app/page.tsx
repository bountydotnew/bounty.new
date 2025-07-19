"use client"
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import V0Hero from "@/components/sections/home/v0-hero";
import { Header } from "@/components/sections/home/header";
import { grim } from "@/hooks/use-dev-log";
import { useGithubStars } from "@/lib/fetchGhStars";

const { log } = grim();

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const waitlistCount = useQuery(trpc.earlyAccess.getWaitlistCount.queryOptions());
  const { data: starCount } = useGithubStars("ripgrim/bounty.new");

  log(`waitlistCount: ${waitlistCount.data?.count}`);
  log(`healthCheck: ${healthCheck.data?.status}`);  

  return (
    <div className="bg-landing-background mx-auto w-full">
      <Header />
      <V0Hero />
    </div>
  );
}
