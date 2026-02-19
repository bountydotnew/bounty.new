import type { Metadata } from "next";
import ClientPage from "./page-client";

export const metadata: Metadata = {
	title: "Contributors",
	description: "Meet the developers building bounty.new.",
};

export default function Page() {
	return <ClientPage />;
}
