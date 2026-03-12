// prisma.config.ts — Prisma v7 configuration
// Connection URLs live here instead of schema.prisma as of Prisma v7.
// Docs: https://pris.ly/d/prisma-config
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // url       — runtime connection; use pooler + ?pgbouncer=true in production
    url: process.env.DATABASE_URL,
    // directUrl — used by Prisma CLI for migrations (always a direct connection)
    directUrl: process.env.DIRECT_URL,
  },
});
