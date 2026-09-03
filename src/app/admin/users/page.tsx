import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { toFaDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "کاربران مدیریت",
};

export default async function AdminUsersPage() {
  const [clientCount, lawyers, staff] = await Promise.all([
    prisma.user.count({ where: { role: "client" } }),
    prisma.user.findMany({
      where: { role: "lawyer" },
      select: { fullName: true, lawyerSlug: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["admin", "manager"] } },
      select: { fullName: true, role: true },
      orderBy: { role: "asc" },
    }),
  ]);

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-gold-deep">دسترسی</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">کاربران</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        شماره موبایل موکل‌ها اینجا فهرست نمی‌شود. وکلا همان اسامی عمومی سایت هستند.
      </p>

      <div className="mt-8 rounded-xl border border-navy/10 bg-white px-5 py-4">
        <p className="text-xs text-navy/45">تعداد موکل</p>
        <p className="mt-1 font-heading text-2xl font-bold">{toFaDigits(clientCount)}</p>
      </div>

      <h2 className="mt-8 font-heading text-lg font-semibold">وکلا</h2>
      <ul className="mt-3 divide-y divide-navy/8 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {lawyers.map((item) => (
          <li key={item.lawyerSlug ?? item.fullName} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{item.fullName}</span>
            <span className="text-navy/45" dir="ltr">
              {item.lawyerSlug ?? "—"}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-heading text-lg font-semibold">مدیریت</h2>
      <ul className="mt-3 divide-y divide-navy/8 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {staff.map((item) => (
          <li key={item.fullName + item.role} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{item.fullName}</span>
            <span className="text-navy/45">{item.role === "manager" ? "مدیر دفتر" : "ادمین"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
