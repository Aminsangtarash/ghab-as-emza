import { createHash, randomBytes } from "crypto";

import {
  createSession,
  createUser,
  findUserByPhone,
  getUserBySession,
  markUserLogin,
  toPublicUser,
  type StoredUser,
} from "@/lib/store-users";
import type { PublicUser } from "@/lib/store-types";

export { toPublicUser };

export const SESSION_COOKIE = "gae_session";

export function hashPassword(password: string) {
  return createHash("sha256").update(`gae:${password}`).digest("hex");
}

export function newSessionToken() {
  return randomBytes(24).toString("hex");
}

function publicFromStored(user: StoredUser): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function getRequestUser(request: {
  cookies: { get(name: string): { value: string } | undefined };
}) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserBySession(token);
}

export async function getServerUser() {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserBySession(token);
}

export async function registerAccount(fullName: string, phone: string, password: string) {
  const existing = await findUserByPhone(phone);
  if (existing) {
    return { error: "این شماره قبلاً ثبت شده است." as const };
  }
  const user = await createUser({
    fullName,
    phone,
    passwordHash: hashPassword(password),
  });
  const token = newSessionToken();
  await createSession(token, user.id);
  return { user: publicFromStored(user), token };
}

export async function loginAccount(phone: string, password: string) {
  const user = await findUserByPhone(phone);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { error: "شماره یا رمز عبور نادرست است." as const };
  }
  if (user.active === false) {
    return { error: "حساب شما غیرفعال شده است." as const };
  }
  await markUserLogin(user.id);
  const token = newSessionToken();
  await createSession(token, user.id);
  return { user: publicFromStored(user), token };
}

export function sessionCookieOptions(maxAgeSeconds = 7 * 24 * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
