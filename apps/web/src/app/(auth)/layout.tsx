import type { Metadata } from "next";
import Sidebar from "@/components/dual-sidebar";
import { SignedOut } from "@daveyplate/better-auth-ui";
import RedirectToSignIn from "@/components/auth/redirect-to-signin";

export const metadata: Metadata = {
  title: "bounty.new",
  description: "bounty.new",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
        {children}
      </Sidebar>
    </>
  );
}
