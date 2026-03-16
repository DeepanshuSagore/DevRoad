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

  // Supabase on serverless commonly requires SSL in production.
  // Keep local development untouched to avoid TLS chain issues on some networks.
  if (
    process.env.NODE_ENV === "production" &&
    unquoted.includes("supabase.co") &&
    !/[?&]sslmode=/.test(unquoted)
  ) {
    return `${unquoted}${unquoted.includes("?") ? "&" : "?"}sslmode=require`;
  }

  return unquoted;
}

function createPrismaClient() {
  const rawConnectionString =
    process.env.NODE_ENV === "production"
      ? process.env.DATABASE_URL
      : process.env.DIRECT_URL || process.env.DATABASE_URL;

  const connectionString = normalizeConnectionString(rawConnectionString);

  if (!connectionString) {
    throw new Error(
      "Database connection URL is not set. Configure DIRECT_URL for local dev and DATABASE_URL for production."
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
