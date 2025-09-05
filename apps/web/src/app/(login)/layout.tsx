import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'bounty.new - Login',
  description: 'Ship fast, get paid faster.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'bounty.new - Login',
    description: 'Ship fast, get paid faster.',
    url: 'https://bounty.new/login',
    siteName: 'bounty.new - Login',
    images: [
      {
        url: '/ogimage.png',
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
