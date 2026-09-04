import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import {
  canStaff,
  requireStaffRole,
  type StaffCapability,
} from "@/lib/admin-permissions";
import type { PublicUser } from "@/lib/store-types";

export async function requireStaff(
  request: NextRequest,
  capability?: StaffCapability,
): Promise<{ user: PublicUser } | { error: NextResponse }> {
  const user = await getRequestUser(request);
  if (!user || !requireStaffRole(user.role)) {
    return {
      error: NextResponse.json({ error: "فقط کارکنان مدیریت دسترسی دارند." }, { status: 403 }),
    };
  }
  if (user.active === false) {
    return {
      error: NextResponse.json({ error: "حساب شما غیرفعال است." }, { status: 403 }),
    };
  }
  if (capability && !canStaff(user.role, capability)) {
    return {
      error: NextResponse.json({ error: "برای این عملیات مجوز ندارید." }, { status: 403 }),
    };
  }
  return { user };
}
