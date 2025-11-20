import { polarClient } from '@polar-sh/better-auth';
import {
  adminClient,
  deviceAuthorizationClient,
  passkeyClient,
  lastLoginMethodClient,
  emailOTPClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { multiSessionClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [
    polarClient(),
    passkeyClient(),
    adminClient(),
    deviceAuthorizationClient(),
    lastLoginMethodClient(),
    emailOTPClient(),
    multiSessionClient(),
  ],
});
