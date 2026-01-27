import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const allowedOrigins = [
	"https://bounty.new",
	"https://www.bounty.new",
	"https://local.bounty.new",
	"https://preview.bounty.new",
	"http://localhost:3000",
];

export function proxy(request: NextRequest) {
	const origin = request.headers.get("origin");

	// Handle CORS preflight requests
	if (request.method === "OPTIONS") {
		const response = new NextResponse(null, { status: 200 });

		if (origin && allowedOrigins.includes(origin)) {
			response.headers.set("Access-Control-Allow-Origin", origin);
		}

		response.headers.set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS"
		);
		response.headers.set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version"
		);
		response.headers.set("Access-Control-Allow-Credentials", "true");

		return response;
	}

	// Handle actual requests
	const response = NextResponse.next();

	if (origin && allowedOrigins.includes(origin)) {
		response.headers.set("Access-Control-Allow-Origin", origin);
	}

	response.headers.set("Access-Control-Allow-Credentials", "true");

	return response;
}

export const config = {
	matcher: "/api/auth/:path*",
};