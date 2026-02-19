import type { Metadata } from "next";
import ClientPage from "./page-client";

export const metadata: Metadata = {
	title: "Linear Projects",
	description: "Browse Linear projects.",
};

export default function Page() {
	return <ClientPage />;
}
