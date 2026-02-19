import type { Metadata } from "next";
import LoginPage from "./page-client";

export const metadata: Metadata = {
	title: "Login",
	description: "Sign in to your bounty.new account",
};

export default function Page() {
	return <LoginPage />;
}
