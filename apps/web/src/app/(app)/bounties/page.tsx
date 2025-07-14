"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function BountiesPage() {
  const { data: bounties, isLoading, error } = useQuery(
    trpc.bounties.getAll.queryOptions({ 
      page: 1, 
      limit: 50
    })
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Bounties</h1>
          <p className="text-gray-600">{error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Bounties</h1>
        <Button asChild>
          <Link href="/create-bounty">
            Create Bounty
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div>
          loading...
        </div>
      ) : bounties?.data && bounties.data.length > 0 ? (
        <>
          <div className="mb-6 text-gray-600">
            Showing {bounties.data.length} of {bounties.pagination?.total || 0} bounties
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.data.map((bounty) => (
             <div className="border border-gray-200 rounded-md p-4">
              <h2 className="text-lg font-bold">{bounty.title}</h2>
              <p className="text-gray-600">{bounty.description}</p>
              <p className="text-gray-600">{bounty.amount}</p>
              <p className="text-gray-600">{bounty.currency}</p>
              <p className="text-gray-600">{bounty.difficulty}</p>
             </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">No bounties available</h2>
          <p className="text-gray-500 mb-6">Be the first to create a bounty!</p>
          <Button asChild>
            <Link href="/create-bounty">
              Create First Bounty
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}