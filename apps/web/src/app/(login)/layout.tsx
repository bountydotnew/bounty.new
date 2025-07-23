import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "bounty.new",
  description: "bounty.new",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
