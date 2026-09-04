"use client";

import { useAuth } from "@/components/auth/auth-provider";

export async function adminFetch<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      return { ok: false, error: data.error || "خطا در انجام عملیات." };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "ارتباط با سرور برقرار نشد." };
  }
}

export function useAdminRole() {
  const { user } = useAuth();
  return user?.role;
}
