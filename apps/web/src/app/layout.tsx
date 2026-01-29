import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './index.css';
import { Providers } from '@/components/providers';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const interDisplay = Inter({
  variable: '--font-inter-display',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bounty.new'),
  title: {
    default: 'bounty',
    template: '%s | bounty',
  },
  description: 'Ship faster. Get paid instantly.',
  icons: {
    icon: '/favicon/favicon_dark.png.png',
    apple: '/favicon/favicon_dark.png.png',
  },
  openGraph: {
    title: {
      default: 'bounty',
      template: '%s | bounty',
    },
    description: 'Ship faster. Get paid instantly.',
    url: 'https://bounty.new',
    siteName: 'bounty',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'bounty.new - Ship faster. Get paid instantly.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: 'bounty',
      template: '%s | bounty',
    },
    description: 'Ship faster. Get paid instantly.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon - using dark version for everything */}
        <link
          rel="icon"
          type="image/png"
          href="/favicon/favicon_dark.png"
        />
        <link rel="apple-touch-icon" href="/favicon/favicon_dark.png" />
        {process.env.NODE_ENV === 'development' && (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              strategy="beforeInteractive"
            />
            <Script
              src="//unpkg.com/@react-grab/cursor/dist/client.global.js"
              strategy="lazyOnload"
            />
            <Script
              async
              crossOrigin="anonymous"
              src="https://tweakcn.com/live-preview.min.js"
            />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${interDisplay.variable} bg-background antialiased`}
      >
        <NuqsAdapter>
          <Providers>
            <script
              async
              data-toolbar-api-key="4570028d-502a-49d8-9435-ce0fc1569093"
              id="toolbar-script"
              src="https://get.usetool.bar/embedded-app.js"
            />
            <div className="grid min-h-svh grid-rows-[auto_1fr]">
              {children}
            </div>
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
