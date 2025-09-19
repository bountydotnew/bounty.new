import { render } from "@react-email/components";
import { createResendClient } from "./client";
import type { SendEmailInput } from "./types";

export const sendEmail = async (input: SendEmailInput) => {
  const resend = createResendClient();
  if (!input.text && !input.html && !input.react) {
    throw new Error("sendEmail requires one of: text, html, or react content.");
  }
  const html = input.html ?? (input.react ? await render(input.react) : undefined);
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const text = input.text ?? (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : undefined);
  const result = await resend.emails.send({
    from: input.from,
    to,
    subject: input.subject,
    html,
    text: text as string,
    headers: input.headers,
    tags: input.tags,
  });
  return result;
};


