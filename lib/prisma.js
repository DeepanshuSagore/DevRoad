import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma Client singleton for Next.js (Prisma v7).
 *
 * Prisma v7 uses the new "client" engine by default, which requires a
 * database adapter. We use @prisma/adapter-pg (the official pg adapter)
 * so no Prisma Accelerate or special cloud setup is needed.
 *
 * The singleton pattern prevents connection pool exhaustion during
 * Next.js hot-reloads in development.
 */

const globalForPrisma = globalThis;

function normalizeConnectionString(value) {
  if (!value) return value;

  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

  // Supabase/Postgres on serverless commonly requires SSL in production.
  if (
    unquoted.includes("supabase.co") &&
    !/[?&]sslmode=/.test(unquoted)
  ) {
    return `${unquoted}${unquoted.includes("?") ? "&" : "?"}sslmode=require`;
  }

  return unquoted;
}

function createPrismaClient() {
  const connectionString = normalizeConnectionString(process.env.DATABASE_URL);

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel Project Settings -> Environment Variables."
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
