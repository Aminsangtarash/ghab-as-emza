import { hashPassword } from "@/lib/auth";
import { PRIMARY_MANAGER_PHONE } from "@/lib/admin-permissions";
import { prisma } from "@/lib/db";

/** رمز اولیه مدیر اول = همان شماره موبایل (قابل ویرایش بعداً). */
export const PRIMARY_MANAGER_PASSWORD = PRIMARY_MANAGER_PHONE;

let seeded = false;

export async function ensureStaffAccounts() {
  if (seeded) return;

  const existing = await prisma.user.findUnique({ where: { phone: PRIMARY_MANAGER_PHONE } });
  if (!existing) {
    await prisma.user.create({
      data: {
        fullName: "مدیر سیستم",
        phone: PRIMARY_MANAGER_PHONE,
        passwordHash: hashPassword(PRIMARY_MANAGER_PASSWORD),
        role: "manager",
      },
    });
  } else if (existing.role !== "manager") {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "manager", lawyerSlug: null },
    });
  }

  // ستون active ممکن است در کلاینت قفل‌شدهٔ Prisma دیده نشود؛ با SQL خام همگام می‌شود.
  await prisma.$executeRawUnsafe(
    `UPDATE User SET active = 1, role = 'manager', lawyerSlug = NULL WHERE phone = ?`,
    PRIMARY_MANAGER_PHONE,
  ).catch(() => undefined);

  seeded = true;
}
