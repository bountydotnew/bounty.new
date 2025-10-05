import { polarClient } from '@polar-sh/better-auth';
import { adminClient, passkeyClient } from 'better-auth/client/plugins';
import { deviceAuthorizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  plugins: [polarClient(), passkeyClient(), deviceAuthorizationClient(), adminClient()],
});
