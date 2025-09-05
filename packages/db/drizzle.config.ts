import { env } from '@bounty/env/server';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/migrations',
  schema: './src/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL || '',
  },
});
