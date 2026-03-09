import "@/lib/env"; // Validate environment variables on first import
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 * Prevents multiple instances during Next.js hot reloads in development.
 * For production serverless, configure connection limits via DATABASE_URL:
 *   ?connection_limit=10&pool_timeout=20
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
