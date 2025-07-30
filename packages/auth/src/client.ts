import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";
import { passkeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://bounty.new"
      : "http://localhost:3000",
  plugins: [
    polarClient(),
    passkeyClient(),
  ],
});
