import type { Metadata } from "next";
import ClientPage from "./page-client";

export const metadata: Metadata = {
	title: "Roadmap",
	description: "See what we're building next.",
};

export default function Page() {
	return <ClientPage />;
}
