export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./sentry.server.config");
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("./sentry.edge.config");
	}
}

export const onRequestError = async (
	err: unknown,
	request: {
		path: string;
		method: string;
		headers: { get?: (key: string) => string | null } | Headers;
	},
) => {
	await import("@sentry/nextjs").then((Sentry) => {
		const userAgent =
			request.headers instanceof Headers
				? request.headers.get("user-agent")
				: typeof request.headers.get === "function"
					? request.headers.get("user-agent")
					: null;

		Sentry.captureException(err, {
			contexts: {
				request: {
					url: request.path,
					method: request.method,
					headers: {
						"user-agent": userAgent,
					},
				},
			},
		});
	});
};
