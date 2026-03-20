'use client';

import { useState } from 'react';
import { MobileBottomNav } from './mobile-bottom-nav';
import { MobileBountyCreateDrawer } from './mobile-bounty-create-drawer';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  return (
    <>
      {/* Main content with bottom padding for nav */}
      <div className="pb-[74px] md:pb-0">{children}</div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav onCreateClick={() => setCreateDrawerOpen(true)} />

      {/* Bounty creation drawer */}
      <MobileBountyCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
      />
    </>
  );
}
