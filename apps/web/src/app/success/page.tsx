"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBilling } from "@/hooks/use-billing";
import Sidebar from "@/components/dual-sidebar";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutId = searchParams.get("checkout_id");
  const { refetch } = useBilling();

  useEffect(() => {
    if (!checkoutId) {
      router.push("/dashboard");
      return;
    }

    refetch();
  }, [checkoutId, refetch, router]);

  if (!checkoutId) {
    return null;
  }

  return (
    <Sidebar>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Thank you for your purchase. Your subscription is now active.</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Checkout ID: {checkoutId}</p>
          </div>
          
          <div className="space-y-3">
            <a
              href="/dashboard"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
            <a
              href="/bounties"
              className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Browse Bounties
            </a>
          </div>
        </div>
      </div>
    </Sidebar>
  );
} 