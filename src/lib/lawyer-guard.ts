import { NextResponse, type NextRequest } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { ensureLawyerAccounts } from "@/lib/lawyer-accounts";

export type LawyerContext = { userId: string; lawyerSlug: string; fullName: string };

export async function requireLawyer(request: NextRequest) {
  await ensureLawyerAccounts();
  const user = await getRequestUser(request);
  if (!user || user.role !== "lawyer" || !user.lawyerSlug) {
    return {
      response: NextResponse.json(
        { error: "این بخش فقط برای حساب وکیل است." },
        { status: 403 },
      ),
    } as const;
  }
  return {
    lawyer: { userId: user.id, lawyerSlug: user.lawyerSlug, fullName: user.fullName } as LawyerContext,
  } as const;
}

export async function readJson(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

export function asText(value: unknown, max = 400) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

export function asInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Math.round(Number(value));
  }
  return undefined;
}

export function asDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function asBool(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}
