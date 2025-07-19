import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/index.css";
import { Providers } from "@/components/providers";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import ReactPlugin from "@stagewise-plugins/react";




const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bounty.new'),
  title: "bounty.new",
  description: "Ship faster. Get paid instantly.",
  icons: {
    icon: "/bdn-b-w-trans.png",
  },
  openGraph: {
    title: "bounty.new",
    description: "Ship faster. Get paid instantly.",
    url: "https://bounty.new",
    siteName: "bounty.new",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "bounty.new - Ship faster. Get paid instantly.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "bounty.new",
    description: "Ship faster. Get paid instantly.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <link rel="icon" href="/bdn-favicon.ico" sizes="any" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
          <div className="grid grid-rows-[auto_1fr] h-svh">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
