import type { MetadataRoute } from 'next';
import { baseUrl } from '../../../../packages/ui/src/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog',
          '/blog/*',
          '/contributors',
          '/waitlist',
          '/login',
          '/dashboard',
          '/bounties',
          '/bounty/create',
          '/discord',
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/bounty/edit/*',
          '/_next/*',
          '/favicon.ico',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
