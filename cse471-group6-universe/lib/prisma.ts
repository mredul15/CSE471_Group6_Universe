import { PrismaClient } from "@prisma/client";

/**
 * Next.js hot-reloads server modules in development, which means
 * `new PrismaClient()` at module scope creates a brand new database
 * connection on every file save until Postgres refuses new connections.
 *
 * Caching the instance on `globalThis` keeps exactly one client alive.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
