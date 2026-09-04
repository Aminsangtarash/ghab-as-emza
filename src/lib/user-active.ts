import "server-only";

import { prisma } from "@/lib/db";

/** خواندن active بدون وابستگی به نسخهٔ کلاینت Prisma */
export async function readUserActive(userId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ active: number | boolean }>>(
      `SELECT active FROM User WHERE id = ? LIMIT 1`,
      userId,
    );
    const value = rows[0]?.active;
    return value === true || value === 1;
  } catch {
    return true;
  }
}

export async function writeUserActive(userId: string, active: boolean) {
  await prisma.$executeRawUnsafe(`UPDATE User SET active = ? WHERE id = ?`, active ? 1 : 0, userId);
}

export async function countActiveLawyers() {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ c: bigint | number }>>(
      `SELECT COUNT(*) AS c FROM User WHERE role = 'lawyer' AND active = 1`,
    );
    return Number(rows[0]?.c ?? 0);
  } catch {
    return prisma.user.count({ where: { role: "lawyer" } });
  }
}
