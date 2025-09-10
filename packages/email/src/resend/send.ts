import { render } from "@react-email/components";
import { createResendClient } from "./client";
import type { SendEmailInput } from "./types";

export async function sendEmail(input: SendEmailInput) {
  const resend = createResendClient();
  const html = input.html ?? (input.react ? await render(input.react) : undefined);
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const text = input.text ?? (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");
  const result = await resend.emails.send({
    from: input.from,
    to,
    subject: input.subject,
    html: html ?? undefined,
    text,
    headers: input.headers,
    tags: input.tags,
  });
  return result;
}


