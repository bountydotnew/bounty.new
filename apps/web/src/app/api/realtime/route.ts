import { handle } from '@upstash/realtime';
import { realtime } from '@bounty/realtime';
import { getServerSession } from '@bounty/auth/server-utils';

export const GET = handle({
  realtime,
  middleware: async ({ request }) => {
    const { data } = await getServerSession();
    if (!data?.user) {
      return new Response('Unauthorized', { status: 401 });
    }
  },
});

