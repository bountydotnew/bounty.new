import type { Metadata } from "next";
import Header from "@/components/header";

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
      <Header />
      {children}
    </>
  );
}
