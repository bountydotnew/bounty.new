"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Checkout Return Page
 *
 * This page handles the redirect after Stripe checkout completion.
 * It checks the payment status and shows success/error UI.
 *
 * URL format: /checkout/return?session_id={CHECKOUT_SESSION_ID}
 */
export default function CheckoutReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [customerEmail, setCustomerEmail] = useState<string | null>(null)

  const getCheckoutSessionStatus = useAction(api.stripe.getCheckoutSessionStatus)

  useEffect(() => {
    if (!sessionId) {
      setStatus("error")
      return
    }

    const checkStatus = async () => {
      try {
        const result = await getCheckoutSessionStatus({ sessionId })

        if (result.paymentStatus === "paid") {
          setStatus("success")
          setCustomerEmail(result.customerEmail || null)
        } else {
          setStatus("error")
        }
      } catch (error) {
        console.error("Error checking session status:", error)
        setStatus("error")
      }
    }

    checkStatus()
  }, [sessionId, getCheckoutSessionStatus])

  // Loading State
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-amber-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Processing your payment...</h2>
          <p className="text-zinc-400 text-sm">Please wait while we confirm your membership</p>
        </div>
      </div>
    )
  }

  // Error State
  if (status === "error") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">Payment Failed</h1>
          <p className="text-zinc-400 text-sm mb-8">
            We couldn't process your payment. Please try again or contact support if the issue persists.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-bold"
            >
              Return to Dashboard
            </Button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Success State
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Success Animation */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-500/20 to-green-500/20 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-amber-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-white mb-3"
          >
            Welcome, Premium Member! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-zinc-400 text-sm mb-2"
          >
            Your payment was successful
          </motion.p>

          {customerEmail && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-zinc-500 text-xs"
            >
              Receipt sent to {customerEmail}
            </motion.p>
          )}
        </div>

        {/* Benefits Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-6 rounded-lg bg-zinc-900 border border-zinc-800 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">What's Unlocked:</h2>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white text-sm">Premium Feature 1</div>
                <div className="text-zinc-500 text-xs">Description of what this unlocks</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white text-sm">Premium Feature 2</div>
                <div className="text-zinc-500 text-xs">Description of what this unlocks</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white text-sm">Premium Feature 3</div>
                <div className="text-zinc-500 text-xs">Description of what this unlocks</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-lg"
          >
            Get Started →
          </Button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full mt-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
