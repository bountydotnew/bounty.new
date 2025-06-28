import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/index.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "bounty.new",
  description: "Ship faster. Get paid instantly.",
  openGraph: {
    images: [
      {
        url: "/og-image.png",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="grid grid-rows-[auto_1fr] h-svh">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
