import { polarClient } from '@polar-sh/better-auth';
import { passkeyClient, adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  plugins: [polarClient(), passkeyClient(), adminClient()],
});
