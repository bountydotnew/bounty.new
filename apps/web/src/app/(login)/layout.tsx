import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "bounty.new - login",
	description: "Login to your bounty.new account",
	icons: {
		icon: "/favicon/favicon_dark.png",
		apple: "/favicon/favicon_dark.png",
	},
	openGraph: {
		title: "bounty.new - login",
		description: "Login to your bounty.new account",
		url: "https://bounty.new/login",
		siteName: "bounty.new - login",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "bounty.new - Login to your bounty.new account",
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
