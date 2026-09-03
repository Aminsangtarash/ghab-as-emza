import { hashPassword } from "@/lib/auth";
import { lawyers } from "@/lib/data";
import { prisma } from "@/lib/db";

export const LAWYER_DEMO_PASSWORD = "Lawyer1405";

let seeded = false;

export function lawyerDemoPhone(index: number) {
  return `09121000${String(index + 1).padStart(3, "0")}`;
}

export async function ensureLawyerAccounts() {
  if (seeded) return;
  for (const [index, lawyer] of lawyers.entries()) {
    const phone = lawyerDemoPhone(index);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ lawyerSlug: lawyer.slug }, { phone }] },
    });
    if (existing) {
      if (existing.role !== "lawyer" || existing.lawyerSlug !== lawyer.slug) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "lawyer", lawyerSlug: lawyer.slug, fullName: lawyer.name },
        });
      }
      continue;
    }
    await prisma.user.create({
      data: {
        fullName: lawyer.name,
        phone,
        passwordHash: hashPassword(LAWYER_DEMO_PASSWORD),
        role: "lawyer",
        lawyerSlug: lawyer.slug,
      },
    });
  }
  seeded = true;
}
