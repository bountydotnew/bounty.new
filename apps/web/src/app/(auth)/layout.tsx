import type { Metadata } from "next";
import Sidebar from "@/components/dual-sidebar";
// import { SignedOut } from "@daveyplate/better-auth-ui";
// import RedirectToSignIn from "@/components/auth/redirect-to-signin";

export const metadata: Metadata = {
  title: "bounty.new",
  description: "bounty.new",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "bounty.new - App",
    description: "Ship fast, get paid faster.",
    url: "https://bounty.new",
    siteName: "bounty.new",
    images: [
      {
        url: "/ogimage.png",
        width: 1200,
        height: 630,
        alt: "bounty.new - Ship fast, get paid faster.",
      },
    ],
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
          {/* <SignedOut>
          <RedirectToSignIn />
        </SignedOut> */}
          {children}
        </Sidebar>
    </>
  );
}
