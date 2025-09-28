import { polarClient } from '@polar-sh/better-auth';
import { adminClient, passkeyClient, emailOTPClient, lastLoginMethodClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  plugins: [polarClient(), passkeyClient(), adminClient(), emailOTPClient(), lastLoginMethodClient()],
});
