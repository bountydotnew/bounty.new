import type { ReactElement } from "react";

export interface SubscribeInput {
  email: string;
  audience: string;
  firstName?: string;
  lastName?: string;
}

export interface UnsubscribeInput {
  email: string;
  audience: string;
}

export interface SendEmailInput<TProps = unknown> {
  to: string | string[];
  subject: string;
  from: string;
  react?: ReactElement<TProps>;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}


