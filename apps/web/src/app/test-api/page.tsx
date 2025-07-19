"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { grim } from "@/hooks/use-dev-log";
import { Header } from "@/components/sections/home/header";

const { log, warn, error } = grim();

export default function TestAPIPage() {
  
  // Test queries using tRPC hooks
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const ping = useQuery(trpc.ping.queryOptions());
  const bounties = useQuery(trpc.bounties.getAll.queryOptions({ page: 1, limit: 5 }));
  
  // Test mutations
  const createBounty = useMutation({
    ...trpc.bounties.create.mutationOptions(),
    onSuccess: () => {
      log("Bounty created!");
      bounties.refetch();
    },
    onError: (error) => {
      warn("Error creating bounty:", error.message);
    }
  });

  // Discord webhook mutations
  const sendWebhook = useMutation({
    ...trpc.notifications.sendWebhook.mutationOptions(),
    onSuccess: (data) => {
      log("Webhook sent:", data);
    },
    onError: (error) => {
      warn("Failed to send webhook:", error.message);
    }
  });

  const reportError = useMutation({
    ...trpc.notifications.reportError.mutationOptions(),
    onSuccess: (data) => {
      log("Error reported:", data);
    },
    onError: (error) => {
      warn("Failed to report error:", error.message);
    }
  });

  // Public webhook test query
  const publicWebhookTest = useQuery(trpc.notifications.testPublicWebhook.queryOptions());

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

  const handleSendWebhook = () => {
    sendWebhook.mutate({
      message: "This is a test message from the test API page",
      title: "Test Webhook",
      type: "info",
      context: {
        timestamp: new Date().toISOString(),
        page: "test-api"
      }
    });
  };

  const handleReportError = () => {
    reportError.mutate({
      error: "This is a test error from the test API page",
      location: "test-api page",
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  };

  const handleTestLogError = () => {
    error("This is a test error using grim error function");
  };

  return (
    <div className="bg-landing-background mx-auto w-full">
      <Header />
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
              {bounties.data.data.map((bounty) => (
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

      {/* Discord Webhook Testing */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">Discord Webhook Testing</h2>
        
        <div className="space-y-3">
          <button
            onClick={handleSendWebhook}
            disabled={sendWebhook.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mr-3"
          >
            {sendWebhook.isPending ? "Sending..." : "Send Test Webhook"}
          </button>
          
          <button
            onClick={handleReportError}
            disabled={reportError.isPending}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 mr-3"
          >
            {reportError.isPending ? "Reporting..." : "Report Test Error"}
          </button>

          <button
            onClick={() => publicWebhookTest.refetch()}
            disabled={publicWebhookTest.isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {publicWebhookTest.isLoading ? "Testing..." : "Test Webhook Connection"}
          </button>
        </div>

        {sendWebhook.error && (
          <p className="text-red-500 mt-2">Send Webhook Error: {sendWebhook.error.message}</p>
        )}
        {reportError.error && (
          <p className="text-red-500 mt-2">Report Error Error: {reportError.error.message}</p>
        )}
        
        {/* Public webhook test (no auth required) */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-md font-medium mb-2">Public Webhook Test</h3>
          <div className="p-3 bg-gray-50 border rounded mb-3">
            {publicWebhookTest.isLoading ? (
              <p className="text-sm text-gray-600">Testing webhook configuration...</p>
            ) : publicWebhookTest.error ? (
              <p className="text-sm text-red-600">❌ Error: {publicWebhookTest.error.message}</p>
            ) : publicWebhookTest.data?.success ? (
              <p className="text-sm text-green-600">✅ {publicWebhookTest.data.message}</p>
            ) : (
              <p className="text-sm text-orange-600">⚠️ {publicWebhookTest.data?.message || 'Unknown status'}</p>
            )}
          </div>
          <button
            onClick={() => publicWebhookTest.refetch()}
            disabled={publicWebhookTest.isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 mr-3"
          >
            {publicWebhookTest.isLoading ? "Testing..." : "Test Webhook Config"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Tests webhook configuration (no authentication required)
          </p>
        </div>

        {/* Client-side error testing (no auth required) */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-md font-medium mb-2">Client-side Error Testing</h3>
          <button
            onClick={handleTestLogError}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Test Log Error (grim)
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Tests client-side error logging (no authentication required)
          </p>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <h4 className="font-medium text-blue-800 mb-2">Setup Instructions:</h4>
          <ul className="space-y-1 text-blue-700">
            <li>• Set <code>DISCORD_WEBHOOK_URL</code> environment variable</li>
            <li>• In development: webhooks are sent to Discord for testing</li>
            <li>• In production: all errors automatically send to Discord</li>
            <li>• No authentication required - all webhook endpoints are public</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}