import { render } from "@react-email/components";
import { createResendClient } from "./client";
import type { SendEmailInput } from "./types";

export const sendEmail = async (input: SendEmailInput) => {
	const resend = createResendClient();
	if (!(input.text || input.html || input.react)) {
		throw new Error("sendEmail requires one of: text, html, or react content.");
	}
	const html =
		input.html ?? (input.react ? await render(input.react) : undefined);
	const to = Array.isArray(input.to) ? input.to : [input.to];
	const text =
		input.text ??
		(html
			? html
					.replace(/<[^>]+>/g, " ")
					.replace(/\s+/g, " ")
					.trim()
			: undefined);
	let result;

	if (input.react && !html) {
		result = await resend.emails.send({
			from: input.from,
			to,
			subject: input.subject,
			react: input.react,
			headers: input.headers,
			tags: input.tags,
		});
	} else if (html) {
		const emailOptions = {
			from: input.from,
			to,
			subject: input.subject,
			html,
			headers: input.headers,
			tags: input.tags,
			...(text && { text }),
		};
		result = await resend.emails.send(emailOptions);
	} else if (text) {
		result = await resend.emails.send({
			from: input.from,
			to,
			subject: input.subject,
			text,
			headers: input.headers,
			tags: input.tags,
		});
	} else {
		throw new Error("No content provided for email");
	}
	return result;
};
