import { createAuthClient } from "better-auth/react";
import { env } from "@bounty/env/client";

export const authClient = createAuthClient({
  baseURL:
      env.NEXT_PUBLIC_SERVER_URL,
});
