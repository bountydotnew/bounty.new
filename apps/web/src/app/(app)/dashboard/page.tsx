"use client"
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const privateData = useQuery(trpc.privateData.queryOptions());
  const bounties = useQuery(trpc.bounties.getAll.queryOptions({ page: 1, limit: 5 }));
  useEffect(() => {
    if (!session && !isPending) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <div>Loading...</div>;
  }
  

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session?.user.name}</p>
      <p>privateData: {privateData.data?.message}</p>
      <div>
        {bounties.isLoading && <div>Loading...</div>}
        {bounties.isError && <div>Error: {bounties.error.message}</div>}
        <p>bounties: {bounties.data?.data.length}</p>
        {bounties.data?.data.map((bounty) => (
          <Card className="border border-gray-200 rounded-md p-4" key={bounty.id}>
            <CardHeader>
              <CardTitle>{bounty.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{bounty.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
