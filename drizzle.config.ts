import { loadEnvConfig } from '@next/env';
import type { Config } from 'drizzle-kit';

// Carrega as variáveis de ambiente do .env.local automaticamente
loadEnvConfig(process.cwd());

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
} satisfies Config;
