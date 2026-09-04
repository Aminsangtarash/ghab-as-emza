import type { User } from "@/generated/prisma";

import { prisma } from "@/lib/db";
import { parseUserRole, type PublicUser, type StoredUser } from "@/lib/store-types";

export type { PublicUser, StoredUser, UserRole } from "@/lib/store-types";
export { parseUserRole } from "@/lib/store-types";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: parseUserRole(user.role),
    lawyerSlug: user.lawyerSlug ?? undefined,
    walletBalance: user.walletBalance,
    active: (user as User & { active?: boolean }).active ?? true,
    email: user.email ?? undefined,
    address: user.address ?? undefined,
    avatarName: user.avatarName ?? undefined,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  };
}

function toStoredUser(user: User): StoredUser {
  return {
    ...toPublicUser(user),
    passwordHash: user.passwordHash,
  };
}

export async function createUser(input: { fullName: string; phone: string; passwordHash: string }) {
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      passwordHash: input.passwordHash,
      lastLoginAt: new Date(),
    },
  });
  return toStoredUser(user);
}

export async function markUserLogin(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
  return toPublicUser(user);
}

export async function updateUserProfile(
  userId: string,
  input: { fullName: string; email?: string; address?: string },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: input.fullName,
      email: input.email ?? null,
      address: input.address ?? null,
    },
  });
  return toPublicUser(user);
}

export async function updateUserPassword(userId: string, currentHash: string, nextHash: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.passwordHash !== currentHash) {
    return { error: "رمز فعلی نادرست است." as const };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: nextHash },
  });
  return { ok: true as const };
}

export async function findUserByPhone(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  return user ? toStoredUser(user) : undefined;
}

export async function createSession(token: string, userId: string) {
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserBySession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  if ((session.user as { active?: boolean }).active === false) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  return toPublicUser(session.user);
}
