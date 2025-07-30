import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";
import { passkeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    polarClient(),
    passkeyClient(),
  ],
});
