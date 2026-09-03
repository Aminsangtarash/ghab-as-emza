import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const ADMIN_DEMO_PASSWORD = "Admin1405";
export const MANAGER_DEMO_PASSWORD = "Manager1405";

const staff = [
  { phone: "09120000001", fullName: "مدیر سیستم", role: "admin", password: ADMIN_DEMO_PASSWORD },
  { phone: "09120000002", fullName: "مدیر دفتر", role: "manager", password: MANAGER_DEMO_PASSWORD },
] as const;

let seeded = false;

export async function ensureStaffAccounts() {
  if (seeded) return;
  for (const person of staff) {
    const existing = await prisma.user.findUnique({ where: { phone: person.phone } });
    if (existing) {
      if (existing.role !== person.role) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: person.role, fullName: person.fullName, lawyerSlug: null },
        });
      }
      continue;
    }
    await prisma.user.create({
      data: {
        fullName: person.fullName,
        phone: person.phone,
        passwordHash: hashPassword(person.password),
        role: person.role,
      },
    });
  }
  seeded = true;
}
