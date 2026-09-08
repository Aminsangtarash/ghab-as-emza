import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { listUserPayoutRequests, requestWalletPayout } from "@/lib/wallet-payout";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  const { prisma } = await import("@/lib/db");
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { walletBalance: true, bankIban: true, bankAccountName: true },
  });
  const items = await listUserPayoutRequests(user.id);
  return NextResponse.json({
    balance: profile?.walletBalance ?? user.walletBalance,
    bankIban: profile?.bankIban ?? null,
    bankAccountName: profile?.bankAccountName ?? null,
    items: items.map((item) => ({
      id: item.id,
      amountToman: item.amountToman,
      status: item.status,
      bankIban: item.bankIban,
      bankAccountName: item.bankAccountName,
      userNote: item.userNote,
      staffNote: item.staffNote,
      createdAt: item.createdAt.toISOString(),
      reviewedAt: item.reviewedAt?.toISOString() ?? null,
      paidAt: item.paidAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const result = await requestWalletPayout({
    userId: user.id,
    amountToman: Number(body.amountToman),
    bankIban: String(body.bankIban ?? ""),
    bankAccountName: String(body.bankAccountName ?? ""),
    userNote: typeof body.userNote === "string" ? body.userNote : undefined,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
