"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { api } from "@/lib/trpc/client"

interface VerifyEmailProps {
  email: string
  onVerified: () => void
  onBack: () => void
}

export function VerifyEmail({ email, onVerified, onBack }: VerifyEmailProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const verifyMutation = api.waitlist.verifyOTP.useMutation()
  const resendMutation = api.waitlist.resendOTP.useMutation()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError("")

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newCode.every((d) => d)) {
      handleVerify(newCode.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (codeStr?: string) => {
    const fullCode = codeStr || code.join("")
    if (fullCode.length !== 6) return

    setIsVerifying(true)

    try {
      await verifyMutation.mutateAsync({ email, code: fullCode })
      onVerified()
    } catch (error: any) {
      setError(error?.message || "Invalid code. Please try again.")
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    try {
      await resendMutation.mutateAsync({ email })
    } catch (error) {
      console.error('Error resending OTP:', error)
    }
  }

  return (
    <div className="w-full max-w-[440px] mx-auto text-center">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#5A5A5A] hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      {/* Email icon */}
      <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-[#191919] border border-[#232323] flex items-center justify-center">
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 6L12 13 2 6" />
        </svg>
      </div>

      <h2 className="text-[32px] font-medium text-white mb-2">Check your email</h2>
      <p className="text-[#929292] text-base mb-8">
        We sent a verification code to
        <br />
        <span className="text-white">{email}</span>
      </p>

      {/* Code input */}
      <div className="flex justify-center gap-3 mb-6">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 rounded-xl bg-[#191919] border border-[#232323] text-white text-2xl text-center outline-none focus:border-[#3A3A3A] transition-colors"
          />
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        onClick={() => handleVerify()}
        disabled={isVerifying || code.some((d) => !d)}
        className="flex items-center justify-center gap-1.5 px-6 h-[40px] rounded-full text-white text-base font-normal mx-auto transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundImage: "linear-gradient(180deg, #ccc 0%, #808080 100%)" }}
      >
        {isVerifying ? "Verifying..." : "Verify"}
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

      <p className="text-[#5A5A5A] text-sm mt-6">
        Didn't receive the code?{" "}
        <button
          onClick={handleResend}
          disabled={resendMutation.isPending}
          className="text-white hover:underline disabled:opacity-50"
        >
          {resendMutation.isPending ? "Sending..." : "Resend"}
        </button>
      </p>
    </div>
  )
}
