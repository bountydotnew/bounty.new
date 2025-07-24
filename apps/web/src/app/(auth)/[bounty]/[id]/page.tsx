"use client";

import { formatCurrency } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";

export default function BountyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bounty = useQuery(trpc.bounties.getById.queryOptions({ id: resolvedParams.id }));

  if (bounty.isLoading) {
    return <div>Loading bounty...</div>;
  }

  if (bounty.error) {
    return <div>Error: {bounty.error.message}</div>;
  }

  if (!bounty.data?.data) {
    return <div>Bounty not found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{bounty.data.data.title}</h1>
      <div className="space-y-4">
        <p className="text-lg">{bounty.data.data.description}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Amount</h3>
            <p>{formatCurrency(Number(bounty.data.data.amount))} {bounty.data.data.currency}</p>
          </div>
          <div>
            <h3 className="font-semibold">Status</h3>
            <p className="capitalize">{bounty.data.data.status}</p>
          </div>
          <div>
            <h3 className="font-semibold">Difficulty</h3>
            <p className="capitalize">{bounty.data.data.difficulty}</p>
          </div>
          {bounty.data.data.deadline && (
            <div>
              <h3 className="font-semibold">Deadline</h3>
              <p>{new Date(bounty.data.data.deadline).toLocaleDateString()}</p>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold">Requirements</h3>
          <p>{bounty.data.data.requirements}</p>
        </div>
        <div>
          <h3 className="font-semibold">Deliverables</h3>
          <p>{bounty.data.data.deliverables}</p>
        </div>
        {bounty.data.data.tags && bounty.data.data.tags.length > 0 && (
          <div>
            <h3 className="font-semibold">Tags</h3>
            <div className="flex gap-2 flex-wrap">
              {bounty.data.data.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-gray-200 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}