"use client";

import { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { CreateBountyDemo } from './create-bounty-demo';
import { SubmitSolutionDemo } from './submit-solution-demo';
import { ApprovePayDemo } from './approve-pay-demo';
import { MacNotification } from './mac-notification';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';

export function Hero() {
  const [activeDemo, setActiveDemo] = useState('create');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [demoKey, setDemoKey] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Check if mobile
  const isMobile = useMediaQuery('(max-width: 768px)');

  const demos = {
    create: 'Create Bounty',
    submit: 'Submit Solution',
    approve: 'Approve & Pay',
  };

  const handleReset = () => {
    setDemoKey((k) => k + 1);
    setShowNotifications(false);
  };

  // Desktop - full interactive demo
  return (
    <section className="relative min-h-screen bg-[#0E0E0E] pt-16">
      <div className="container mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-left max-w-prose mb-8 lg:mb-12">
          <h1 className="text-4xl lg:text-4xl xl:text-4xl font-medium leading-tight text-balance mb-8 text-white">
            Get paid to help your favorite founders build the apps you love
          </h1>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors"
            >
              Create your first bounty
            </a>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden">
          {/* Notifications - desktop only */}
          {!isMobile && showNotifications && activeDemo === 'create' && (
            <div className="absolute top-4 right-4 z-50 space-y-3">
              <MacNotification
                appIcon="github"
                appName="GitHub"
                title="Issue Created"
                message="bountydotnew/bounty.new#42 is now live with your bounty"
                time="now"
                delay={0}
              />
              <MacNotification
                appIcon="stripe"
                appName="Stripe"
                title="Payment Authorized"
                message="$500 charged and held until completion"
                time="now"
                delay={400}
              />
            </div>
          )}
          {!isMobile && showNotifications && activeDemo === 'approve' && (
            <div className="absolute top-4 right-4 z-50 space-y-3">
              <MacNotification
                appIcon="gmail"
                appName="Gmail"
                title="Payment Received"
                message="You've received $500 for completing a bounty on bounty.new"
                time="now"
                delay={0}
              />
              <MacNotification
                appIcon="stripe"
                appName="Stripe"
                title="Deposit Received"
                message="You've received a payment of $500"
                time="now"
                delay={400}
              />
            </div>
          )}

          <div className="relative rounded-2xl overflow-hidden bg-[#1a1a1a]">
            <div className="absolute inset-0">
              <img
                src="/images/asset-cc24ca462279ca23250c.webp"
                alt=""
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>

            <div className="relative z-10 p-8 lg:p-16">
              <div className="relative max-w-5xl mx-auto">
                {/* Demo controls - desktop only */}
                {!isMobile && (
                  <>
                    <div className="absolute -top-10 left-0 z-20">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 text-sm text-[#989898] hover:text-white transition-colors"
                      >
                        <span>{demos[activeDemo as keyof typeof demos]}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute top-8 left-0 bg-[#191919] border border-[#2a2a2a] rounded-lg py-2 min-w-[200px] shadow-xl">
                          {Object.entries(demos).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => {
                                setActiveDemo(key);
                                setDropdownOpen(false);
                                handleReset();
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[#2a2a2a] text-white transition-colors"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleReset}
                      className="absolute -bottom-10 right-0 z-20 w-10 h-10 rounded-full bg-[#191919] border border-[#2a2a2a] flex items-center justify-center text-[#989898] hover:text-white hover:border-[#3a3a3a] transition-all animate-in fade-in zoom-in duration-300"
                      title="Reset demo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Demo container - same size on both, inner content positioned */}
                <div className="h-[500px] lg:h-[600px] overflow-hidden">
                  <div className="h-full w-full">
                    {/* Mobile: static demo content anchored top-left, compact sizing */}
                    {isMobile && (
                      <div className="h-full w-full origin-top-left">
                        <CreateBountyDemo key={0} compact onShowNotifications={() => {}} />
                      </div>
                    )}
                    {/* Desktop: full interactive demo */}
                    {!isMobile && activeDemo === 'create' && (
                      <CreateBountyDemo key={demoKey} onShowNotifications={() => setShowNotifications(true)} />
                    )}
                    {!isMobile && activeDemo === 'submit' && <SubmitSolutionDemo key={demoKey} />}
                    {!isMobile && activeDemo === 'approve' && (
                      <ApprovePayDemo key={demoKey} onShowNotifications={() => setShowNotifications(true)} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
