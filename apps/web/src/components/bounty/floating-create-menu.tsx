'use client';

import { SidebarTrigger } from '@bounty/ui/components/sidebar';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MobileSidebar } from '@/components/dual-sidebar/mobile-sidebar';

interface FloatingCreateMenuProps {
  onCreate: () => void;
  onImport: () => void;
  disabled?: boolean;
}

export function FloatingCreateMenu({
  //onCreate,
  //onImport,
  disabled = false,
}: FloatingCreateMenuProps) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`-translate-x-1/2 fixed bottom-6 left-1/2 z-40 transition-all duration-200 ease-out lg:hidden ${show ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-95 opacity-0'}`}
    >
      <div className="relative">
        <div className="grid min-w-[14rem] grid-cols-3 items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-4 py-2 shadow backdrop-blur">
          <SidebarTrigger className="h-9 w-9 justify-self-start rounded-lg p-0 text-neutral-300 hover:bg-neutral-800" />

          <div className="relative mx-1 justify-self-center">
            <button
              aria-expanded={open}
              aria-label="Open create menu"
              className={`mt-1 size-10 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-200 shadow transition active:scale-[.98] ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-neutral-800'}`}
              disabled={disabled}
              onClick={() => setOpen((v) => !v)}
            >
              <Plus
                className={`mx-auto h-5 w-5 transition-transform ${open ? 'rotate-45' : 'rotate-0'}`}
              />
            </button>
          </div>

          <MobileSidebar className="h-9 w-9 justify-self-end rounded-lg p-0 text-neutral-300 hover:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
