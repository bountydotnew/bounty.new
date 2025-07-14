"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export default function TestAPIPage() {
  const queryClient = useQueryClient();
  
  // Test queries using tRPC hooks
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const ping = useQuery(trpc.ping.queryOptions());
  const bounties = useQuery(trpc.bounties.getAll.queryOptions({ page: 1, limit: 5 }));
  
  // Test mutations
  const createBounty = useMutation({
    ...trpc.bounties.create.mutationOptions(),
    onSuccess: () => {
      console.log("Bounty created!");
      bounties.refetch();
    },
    onError: (error: any) => {
      console.error("Error creating bounty:", error.message);
    }
  });

  const handleCreateBounty = () => {
    createBounty.mutate({
      title: "Test Bounty",
      description: "This is a test bounty description with enough characters",
      requirements: "Basic requirements for this test bounty project",
      deliverables: "Completed code and documentation as deliverables",
      amount: "100.00",
      currency: "USD",
      difficulty: "intermediate",
      tags: ["test", "javascript"],
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      {/* Health Check */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Health Check</h2>
        <p>Status: {healthCheck.isLoading ? "Loading..." : healthCheck.data?.status}</p>
        <p>Message: {healthCheck.data?.message}</p>
      </div>

      {/* Ping */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Ping</h2>
        <p>Message: {ping.data?.message}</p>
        <p>Timestamp: {ping.data?.timestamp}</p>
      </div>

      {/* Bounties List */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Bounties</h2>
        {bounties.isLoading && <p>Loading bounties...</p>}
        {bounties.error && <p className="text-red-500">Error: {bounties.error.message}</p>}
        {bounties.data?.success && (
          <div>
            <p>Total: {bounties.data.pagination?.total}</p>
            <div className="space-y-2 mt-2">
              {bounties.data.data.map((bounty: any) => (
                <div key={bounty.id} className="p-2 bg-gray-50 rounded">
                  <h3 className="font-medium">{bounty.title}</h3>
                  <p className="text-sm text-gray-600">${bounty.amount} {bounty.currency}</p>
                  <p className="text-xs text-gray-500">Status: {bounty.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Bounty */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Create Test Bounty</h2>
        <button
          onClick={handleCreateBounty}
          disabled={createBounty.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {createBounty.isPending ? "Creating..." : "Create Test Bounty"}
        </button>
        {createBounty.error && (
          <p className="text-red-500 mt-2">Error: {createBounty.error.message}</p>
        )}
      </div>
    </div>
  );
}