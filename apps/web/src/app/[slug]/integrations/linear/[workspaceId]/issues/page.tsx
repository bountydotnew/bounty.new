import type { Metadata } from "next";
import ClientPage from "./page-client";

export const metadata: Metadata = {
	title: "Linear Issues",
	description: "Browse and create bounties from Linear issues.",
};

export default function Page() {
	return <ClientPage />;
}
