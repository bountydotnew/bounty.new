import { handle } from "@upstash/realtime";
import { realtime } from "@bounty/realtime";
import { auth } from "@bounty/auth/server";

export const GET = handle({
	realtime,
	middleware: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user) {
			return new Response("Unauthorized", { status: 401 });
		}
	},
});
