"use client"

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { authClient } from "@bounty/auth/client"

interface OnboardingProps {
  entryId: string
  onComplete: () => void
}

export function Onboarding({ entryId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<"creator" | "developer" | null>(null)
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubData, setGithubData] = useState<{
    id: string
    username: string
    email: string
    name: string
  } | null>(null)

  const completeOnboardingMutation = api.waitlist.completeOnboarding.useMutation()

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    try {
      await completeOnboardingMutation.mutateAsync({
        entryId,
        role: role!,
        githubId: githubData?.id,
        githubUsername: githubData?.username,
        githubEmail: githubData?.email,
        name: githubData?.name,
        username: githubData?.username,
      })
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  const handleConnectGithub = async () => {
    try {
      const response = await authClient.signIn.social({
        provider: "github",
        callbackURL: window.location.href,
      })

      if (response.data) {
        // Extract GitHub data from the response
        setGithubData({
          id: response.data.user?.id || "",
          username: response.data.user?.handle || "",
          email: response.data.user?.email || "",
          name: response.data.user?.name || "",
        })
        setGithubConnected(true)
      }
    } catch (error) {
      console.error('Error connecting GitHub:', error)
    }
  }

  const canProceed = () => {
    if (step === 1) return role !== null
    return true
  }

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Progress bar */}
      <div className="flex gap-2 mb-12">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-white" : "bg-[#232323]"}`}
          />
        ))}
      </div>

      {/* Step 1: Role selection */}
      {step === 1 && (
        <div>
          <h2 className="text-[32px] font-medium text-white mb-2">How will you use bounty.new?</h2>
          <p className="text-[#929292] text-base mb-8">You can always do both later</p>

          <div className="space-y-3">
            <button
              onClick={() => setRole("creator")}
              className={`w-full p-5 rounded-xl border text-left transition-colors ${
                role === "creator"
                  ? "bg-[#1E1E1E] border-white"
                  : "bg-[#191919] border-[#232323] hover:border-[#3A3A3A]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#232323] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2v20M2 12h20" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white text-lg font-medium mb-1">Post bounties</h3>
                  <p className="text-[#929292] text-sm">I want to post challenges and pay developers to solve them</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setRole("developer")}
              className={`w-full p-5 rounded-xl border text-left transition-colors ${
                role === "developer"
                  ? "bg-[#1E1E1E] border-white"
                  : "bg-[#191919] border-[#232323] hover:border-[#3A3A3A]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#232323] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white text-lg font-medium mb-1">Solve bounties</h3>
                  <p className="text-[#929292] text-sm">I want to find bounties, ship solutions, and get paid</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: GitHub */}
      {step === 2 && (
        <div>
          <h2 className="text-[32px] font-medium text-white mb-2">Connect GitHub</h2>
          <p className="text-[#929292] text-base mb-8">
            {role === "creator"
              ? "Import issues as bounties directly from your repos"
              : "Showcase your work and submit PRs seamlessly"}
          </p>

          {!githubConnected ? (
            <button
              onClick={handleConnectGithub}
              className="w-full h-14 rounded-xl bg-[#191919] border border-[#232323] text-white text-base flex items-center justify-center gap-3 hover:border-[#3A3A3A] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Connect GitHub
            </button>
          ) : (
            <div className="w-full p-4 rounded-xl bg-[#191919] border border-[#232323] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#232323] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white text-base">@{githubData?.username || "username"}</p>
                <p className="text-[#5A5A5A] text-sm">Connected</p>
              </div>
              <svg
                className="w-5 h-5 text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          )}

          <button onClick={handleNext} className="text-[#5A5A5A] text-sm mt-4 hover:text-white transition-colors">
            Skip for now
          </button>
        </div>
      )}

      {/* Continue button */}
      <button
        onClick={handleNext}
        disabled={!canProceed() || completeOnboardingMutation.isPending}
        className="mt-10 flex items-center justify-center gap-1.5 px-6 h-[40px] rounded-full text-white text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundImage: "linear-gradient(180deg, #ccc 0%, #808080 100%)" }}
      >
        {completeOnboardingMutation.isPending ? "Completing..." : step === 2 ? "Go to dashboard" : "Continue"}
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
