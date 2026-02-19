import { Resend } from "resend";

export function createResendClient(apiKey?: string) {
	const key = (apiKey ?? process.env.RESEND_API_KEY)?.trim();
	if (!key) {
		throw new Error("RESEND_API_KEY missing");
	}
	return new Resend(key);
}
