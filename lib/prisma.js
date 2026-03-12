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

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
