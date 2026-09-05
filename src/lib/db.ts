import { PrismaClient } from "@/generated/prisma";

import { ensureDatabaseUrl } from "@/lib/db-url";

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
