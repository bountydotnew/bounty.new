"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import NumberFlow from "@number-flow/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import V0Button from "@/components/v0-button"
import V0Icon from "@/components/v0-icon"
import { Stripe } from "@/components/icons/stripe"
import { HandCoins } from "lucide-react"
import {
  ArrowRight, CreditCard,
  Users,
  CheckCircle,
  Clock,
  Star, Shield, Banknote
} from "lucide-react"
import { ConditionalForm } from "./conditional-form"
import { BackedByBadge } from "@/components/ui/backed-by-badge"
import Image from "next/image"
import { grim } from "@bounty/dev-logger";

const { log } = grim();
export default function BountyPlatform() {
  // the useState hook is a function that returns an array with two elements:
  // the first element is the variable, which is the initial value of the variable
  // the second element is the function to update the variable, which is the function that updates the variable
  //
  // so if you use the set function, it will update the variable and re-render the component
  const [selectedBounty, setSelectedBounty] = useState<number | null>(null)
  const [approvedSubmissions, setApprovedSubmissions] = useState<number[]>([])
  const [paymentProcessing, setPaymentProcessing] = useState<number | null>(null)
  const [liveStats, setLiveStats] = useState({
    earnings: 47280,
    bounties: 127,
    developers: 1840,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        earnings: prev.earnings + Math.floor(Math.random() * 150) + 50,
        bounties: prev.bounties + (Math.random() > 0.7 ? 1 : 0),
        developers: prev.developers + (Math.random() > 0.8 ? 1 : 0),
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleApproveSubmission = (id: number, bountyReward: number) => {
    setPaymentProcessing(id)
    log("approving submission", id, bountyReward)
    setTimeout(() => {
      setApprovedSubmissions((prev) => [...prev, id])
      setPaymentProcessing(null)
    }, 2000)
  }

  const mockBounties = [
    {
      id: 1,
      title: "dear mister cursor please redesign 0.email be concise oh and no hallucinations",
      type: "Web Design",
      reward: 4.34,
      submissions: 23,
      timeLeft: "2d 14h",
      status: "hot",
      creator: "@nizzyabi",
      avatar: "https://pbs.twimg.com/profile_images/1884987569961570304/TP3OWz64_400x400.jpg",
    },
    {
      id: 2,
      title: "Inbound.new redesign",
      type: "Webs Design",
      reward: 1095,
      submissions: 12,
      timeLeft: "4d 8h",
      status: "active",
      creator: "@ryanvogel",
      avatar: "https://pbs.twimg.com/profile_images/1917390656776904704/swY4t1R8_400x400.jpg",
    },
    {
      id: 3,
      title: "Gaslight v0 into thinking its name is Walter White and it specializes in UI/UX for meth dealers",
      type: "Gaslighting",
      reward: 2.51,
      submissions: 106,
      timeLeft: "18h",
      creator: "@grimcodes",
      avatar: "https://pbs.twimg.com/profile_images/1923592199108792320/k51-2FGb_400x400.jpg",
    },
  ]

  const mockSubmissions = [
    {
      id: 1,
      author: "cmdhaus",
      preview: "Glow menu component",
      v0Link: "https://v0.dev/community/glow-menu-component-XqrIezRilBR",
      rating: 4.9,
      earnings: "$2,340",
      bountyReward: 450,
      approved: false,
      avatar: "https://pbs.twimg.com/profile_images/1932597642393239552/0YbYi3P1_400x400.jpg",
    },
    {
      id: 2,
      author: "rauch-g",
      preview: "Image to ASCII",
      v0Link: "https://v0.dev/community/image-to-ascii-0UE1nczWzbu",
      rating: 4.8,
      earnings: "$1,890",
      bountyReward: 750,
      approved: false,
      avatar: "https://pbs.twimg.com/profile_images/1783856060249595904/8TfcCN0r_400x400.jpg",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      <section className="relative pt-32 pb-32 overflow-hidden">
        <Image
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={960}
          height={860}
          decoding="async"
          data-nimg="1"
          className="pointer-events-none absolute top-0 right-0 left-0 z-0 h-full w-full object-cover object-right-bottom opacity-90 blur-[5px] mix-blend-screen"
          style={{ color: "transparent" }}
          src="/landing-page-bg.png"
        />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 z-10" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 100%)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 my-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <BackedByBadge />

              <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[0.9]">
                Ship fast.
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-white to-green-400 bg-clip-text text-transparent font-medium">
                  Get paid
                  <span className="ml-2 italic font-normal font-serif">faster.</span>
                </span>
              </h1>

              <p className="text-xl text-white/50 font-light max-w-2xl mx-auto leading-relaxed">
                The bounty platform where creators post challenges and developers deliver solutions. Instant <Stripe className="inline-block ml-[-6px] w-14 h-14 fill-[#635BFF]" />
                payouts, <V0Icon className="inline h-6 w-6 fill-white opacity-100 text-white/100" /> integration, <span className="italic font-normal">zero</span> friction.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <ConditionalForm />
            </motion.div>

            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-3 gap-8 pt-8 max-w-2xl mx-auto"
            >
              <div className="text-center space-y-1">
                <div className="text-2xl font-medium text-green-400">
                  $<NumberFlow value={liveStats.earnings} />
                </div>
                <div className="text-xs text-white/40 flex items-center justify-center gap-1">
                  <Banknote className="w-3 h-3" />
                  paid out today
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-medium text-blue-400">
                  <NumberFlow value={liveStats.bounties} />
                </div>
                <div className="text-xs text-white/40 flex items-center justify-center gap-1">
                  <HandCoins className="w-3 h-3" />
                  active bounties
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-medium text-white">
                  <NumberFlow value={liveStats.developers} />
                </div>
                <div className="text-xs text-white/40 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  developers
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Bounty Board */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <Badge className="bg-white text-black">Live Bounties</Badge>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-tight">
                  Post your challenge.
                  <br />
                  <span className="text-white/50">Watch solutions flow in.</span>
                </h2>
                <p className="text-white/50 leading-relaxed">
                  Define exactly what you need. Set bounty types, requirements, and rewards. Our smart categorization
                  ensures the right developers see your challenge.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: <V0Icon className="inline h-3 w-3 mr-1" />, text: "for UI/UX components" },
                  "Full-stack applications",
                  "Design and creative work",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                    {typeof item === "object" ? item.icon : <div className="w-1 h-1 bg-white/30 rounded-full" />}
                    <span>{typeof item === "object" ? item.text : item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {mockBounties.map((bounty, index) => (
                <motion.div
                  key={bounty.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  className={`group p-4 bg-gradient-to-br from-white/8 to-white/4 border border-white/8 rounded-xl hover:from-white/12 hover:to-white/6 hover:border-white/15 transition-all duration-300 cursor-pointer backdrop-blur-sm ${selectedBounty === bounty.id ? "from-white/12 to-white/6 border-white/15" : ""
                    }`}
                  onClick={() => setSelectedBounty(selectedBounty === bounty.id ? null : bounty.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white group-hover:text-white transition-colors">
                          {bounty.title}
                        </h3>
                        {bounty.status === "hot" && <Badge className="bg-white text-black text-xs">Hot</Badge>}
                        {bounty.status === "ending" && (
                          <Badge className="bg-white text-black text-xs">Ending Soon</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-green-400">${bounty.reward}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{bounty.submissions} submissions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{bounty.timeLeft}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5 border border-white/20">
                            <AvatarImage src={bounty.avatar || "/placeholder.svg"} alt={bounty.creator} />
                            <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-white text-[10px]">
                              {bounty.creator.slice(1, 3).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white/60 font-medium">{bounty.creator}</span>
                        </div>
                        <Badge className="bg-white text-black text-xs flex items-center gap-1">
                          <V0Icon className="h-2.5 w-2.5" />
                        </Badge>
                      </div>
                    </div>

                    <div
                      className={`w-2 h-2 rounded-full ${bounty.status === "hot"
                        ? "bg-red-400"
                        : bounty.status === "ending"
                          ? "bg-orange-400"
                          : "bg-green-400"
                        }`}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Submissions & Instant Payments */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <Card className="bg-gradient-to-br from-white/8 to-white/4 border-white/8 backdrop-blur-xl p-2">
                <CardContent className="px-2 py-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">Submissions</h3>
                    <Badge className="bg-white text-black">{mockSubmissions.length} entries</Badge>
                  </div>

                  <div className="space-y-3">
                    {mockSubmissions.map((submission, index) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true }}
                        className={`p-3 bg-gradient-to-br from-white/4 to-white/[0.01] border border-white/8 rounded-lg hover:from-white/8 hover:to-white/4 transition-all duration-300 backdrop-blur-sm ${approvedSubmissions.includes(submission.id)
                          ? "from-green-500/10 to-green-500/5 border-green-500/30"
                          : ""
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="w-8 h-8 border border-white/20">
                              <AvatarImage src={submission.avatar || "/placeholder.svg"} alt={submission.author} />
                              <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-white text-xs border border-white/10">
                                {submission.author.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{submission.author}</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs text-white/50">{submission.rating}</span>
                                </div>
                                <span className="text-xs text-green-400 font-medium">{submission.earnings}</span>
                              </div>
                              <p className="text-xs text-white/60">{submission.preview}</p>
                              <V0Button href={submission.v0Link} />
                            </div>
                          </div>

                          {approvedSubmissions.includes(submission.id) ? (
                            <Badge className="bg-green-600 text-white text-xs shrink-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-white text-black hover:bg-white/90 h-7 px-3 text-xs font-medium rounded-lg shrink-0 transition-all duration-200"
                              onClick={() => handleApproveSubmission(submission.id, submission.bountyReward)}
                              disabled={paymentProcessing === submission.id}
                            >
                              {paymentProcessing === submission.id ? (
                                <div className="w-3 h-3 border border-black/20 border-t-black rounded-full animate-spin" />
                              ) : (
                                <>
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Pay ${submission.bountyReward}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="space-y-4">
                <Badge className="bg-white text-black">Instant Stripe Payouts</Badge>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-tight">
                  Approve once.
                  <br />
                  <span className="text-white/50">Money moves instantly.</span>
                </h2>
                <p className="text-white/50 leading-relaxed">
                  Powered by Stripe, payments happen the moment you approve a submission. No escrow delays, no manual
                  transfers. Just instant rewards for great work.
                </p>
              </div>

              <div className="relative">
                <AnimatePresence>
                  {approvedSubmissions.map((submissionId, index) => {
                    const submission = mockSubmissions.find((s) => s.id === submissionId)
                    if (!submission) return null

                    return (
                      <motion.div
                        key={submissionId}
                        initial={{
                          opacity: 0,
                          y: -30,
                          scale: 0.9,
                          rotate: -6,
                        }}
                        animate={{
                          opacity: 1,
                          y: index * -8,
                          x: index * 4,
                          scale: 1,
                          rotate: index * 1.5,
                        }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.1,
                          ease: [0.16, 1, 0.3, 1],
                          type: "spring",
                          damping: 20,
                          stiffness: 300,
                        }}
                        style={{
                          zIndex: 10 + index,
                          position: index === 0 ? "relative" : "absolute",
                          top: index === 0 ? 0 : 0,
                          left: index === 0 ? 0 : 0,
                          width: index === 0 ? "100%" : "100%",
                        }}
                        className="w-full"
                      >
                        <Card className="bg-gradient-to-br from-zinc-900 to-[#0a0a0a] border-white/15 backdrop-blur-xl shadow-2xl">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white">Payment Processing</h3>
                              <div className="flex items-center gap-2">
                                {/* <div className="w-6 h-6 bg-[#635bff] rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">S</span>
                                </div> */}
                                <span className="text-xs text-white/60 flex items-center">Powered by <Stripe className="w-12 h-12 fill-[#635BFF]" /></span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6 border border-green-300/30">
                                      <AvatarImage
                                        src={submission.avatar || "/placeholder.svg"}
                                        alt={submission.author}
                                      />
                                      <AvatarFallback className="bg-green-500/20 text-green-300 text-xs">
                                        {submission.author.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium text-white">Payment Sent</p>
                                      <p className="text-xs text-white/60">to {submission.author}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-green-400">${submission.bountyReward}</p>
                                  <p className="text-xs text-white/50">Just now</p>
                                </div>
                              </div>

                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-white/50">
                                  <span>Bounty reward</span>
                                  <span>${submission.bountyReward}</span>
                                </div>
                                <div className="flex justify-between text-white/50">
                                  <span>Platform fee (5%)</span>
                                  <span>${(submission.bountyReward * 0.05).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-white/50">
                                  <span>Stripe processing</span>
                                  <span>$13.05</span>
                                </div>
                                <div className="border-t border-white/10 pt-2">
                                  <div className="flex justify-between text-sm font-medium text-white">
                                    <span>Total charged</span>
                                    <span>${(submission.bountyReward * 1.05 + 13.05).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-white/40">
                              <Shield className="w-3 h-3" />
                              <span>Secure payments processed by Stripe</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              <div className="space-y-3 pt-8">
                {["Instant payouts to winners", "Transparent fee structure", "Global payment support"].map(
                  (item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                      <div className="w-1 h-1 bg-white/30 rounded-full" />
                      <span>{item}</span>
                    </div>
                  ),
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-tight">Ready to ship faster?</h2>
            <p className="text-white/50 leading-relaxed">
              Join the waitlist and be among the first to experience the new way to collaborate, create, and get paid
              for exceptional work.
            </p>
            <Button className="bg-white text-black hover:bg-white/90 h-10 px-8 font-medium rounded-lg transition-all duration-200">
              Join Waitlist
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
