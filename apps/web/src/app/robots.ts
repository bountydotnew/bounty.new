import { baseUrl } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/blog/*",
          "/contributors",
          "/waitlist",
          "/login",
          "/dashboard",
          "/bounties",
          "/bounty/create",
          "/discord",
        ],
        disallow: [
          "/admin/*",
          "/api/*",
          "/bounty/edit/*",
          "/_next/*",
          "/favicon.ico",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
} 