import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'bounty.new - Login',
  description: 'Ship fast, get paid faster.',
  icons: {
    icon: '/favicon/favicon_dark.png',
    apple: '/favicon/favicon_dark.png',
  },
  openGraph: {
    title: 'bounty.new - Login',
    description: 'Ship fast, get paid faster.',
    url: 'https://bounty.new/login',
    siteName: 'bounty.new - Login',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'bounty.new - Ship fast, get paid faster.',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
