import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton. Not used by the MVP pages (they run on the
 * in-memory store in lib/store.ts) — wire routes to this once DATABASE_URL
 * points at a real Postgres instance and `npm run db:migrate` has run.
 */
const g = globalThis as unknown as { __prisma?: PrismaClient };

export function prisma(): PrismaClient {
  if (!g.__prisma) g.__prisma = new PrismaClient();
  return g.__prisma;
}
