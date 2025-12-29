import { polarClient } from '@polar-sh/better-auth';
import {
  adminClient,
  deviceAuthorizationClient,
  lastLoginMethodClient,
  emailOTPClient,
} from 'better-auth/client/plugins';
import { passkey } from "@better-auth/passkey"
import { createAuthClient } from 'better-auth/react';
import { multiSessionClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [
    polarClient(),
    passkey(),
    adminClient(),
    deviceAuthorizationClient(),
    lastLoginMethodClient(),
    emailOTPClient(),
    multiSessionClient(),
  ],
});
