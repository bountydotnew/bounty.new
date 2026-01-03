import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from './routers';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Bounty.new API',
  description: 'API for the bounty.new platform - Create, manage, and discover bounties for software development tasks.',
  version: '1.0.0',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001',
  docsUrl: 'https://bounty.new/docs',
  tags: ['Health', 'Bounties', 'Users', 'Profiles', 'Comments', 'Notifications', 'Early Access'],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Authentication token from Better Auth',
    },
  },
});

export { generateOpenApiDocument };
