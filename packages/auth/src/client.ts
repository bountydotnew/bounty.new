import { polarClient } from '@polar-sh/better-auth';
import {
  adminClient,
  deviceAuthorizationClient,
  emailOTPClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { multiSessionClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [
    polarClient(),
    adminClient(),
    deviceAuthorizationClient(),
    emailOTPClient(),
    multiSessionClient(),
  ],
});
