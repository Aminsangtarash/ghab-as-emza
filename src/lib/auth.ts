import { createHash, randomBytes } from "crypto";

import {
  createSession,
  createUser,
  findUserByPhone,
  getUserBySession,
  markUserLogin,
  toPublicUser,
} from "@/lib/store";

export { toPublicUser };

export const SESSION_COOKIE = "gae_session";

export function hashPassword(password: string) {
  return createHash("sha256").update(`gae:${password}`).digest("hex");
}

export function newSessionToken() {
  return randomBytes(24).toString("hex");
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
  if (await findUserByPhone(phone)) {
    return { error: "این شماره قبلاً ثبت شده است. وارد شوید." as const };
  }
  try {
    const user = await createUser({
      fullName,
      phone,
      passwordHash: hashPassword(password),
    });
    const token = newSessionToken();
    await createSession(token, user.id);
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return { user: publicUser, token };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { error: "این شماره قبلاً ثبت شده است. وارد شوید." as const };
    }
    throw error;
  }
}

export async function loginAccount(phone: string, password: string) {
  const user = await findUserByPhone(phone);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { error: "شماره موبایل یا رمز عبور نادرست است." as const };
  }
  const token = newSessionToken();
  await createSession(token, user.id);
  return { user: await markUserLogin(user.id), token };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  };
}
