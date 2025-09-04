"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { MobileSidebar } from "@/components/dual-sidebar/mobile-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface FloatingCreateMenuProps {
    onCreate: () => void;
    onImport: () => void;
    disabled?: boolean;
}

export function FloatingCreateMenu({ onCreate, onImport, disabled = false }: FloatingCreateMenuProps) {
    const [open, setOpen] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setShow(window.scrollY > 40);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden transition-all duration-200 ease-out ${show ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-2 scale-95 pointer-events-none"}`}>
            <div className="relative">
                <div className="rounded-full border border-neutral-800 bg-neutral-900/90 backdrop-blur px-4 py-2 shadow grid grid-cols-3 items-center gap-2 min-w-[14rem]">
                    <SidebarTrigger className="justify-self-start h-9 w-9 p-0 rounded-lg text-neutral-300 hover:bg-neutral-800" />

                    <div className="relative mx-1 justify-self-center">
                        <button
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            aria-label="Open create menu"
                            className={`size-10 rounded-full mt-1 border border-neutral-700 bg-neutral-900 text-neutral-200 shadow transition active:scale-[.98] ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-800"}`}
                            disabled={disabled}
                        >
                            <Plus className={`h-5 w-5 mx-auto transition-transform ${open ? "rotate-45" : "rotate-0"}`} />
                        </button>
                    </div>

                    <MobileSidebar className="justify-self-end h-9 w-9 p-0 rounded-lg text-neutral-300 hover:bg-neutral-800" />
                </div>
            </div>
        </div>
    );
}


