import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://saas_docs:saas_docs_password@localhost:5432/saas_docs?schema=public',
  },
});