"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AdminErrorNote,
  AdminHeading,
  AdminOkNote,
  AdminSectionCard,
  adminFetch,
  adminInputClass,
  panelCard,
} from "@/components/admin/admin-ui";
import { formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type Promo = { code: string; percent: number; title: string; active: boolean };
type Fee = { serviceSlug: string; title: string; feeToman: number };

export function AdminPricingPanel() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: "", percent: "10", title: "" });
  const [feeDraft, setFeeDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const result = await adminFetch<{ promos: Promo[]; fees: Fee[] }>("/api/admin?view=pricing");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPromos(result.data.promos);
    setFees(result.data.fees);
    setFeeDraft(Object.fromEntries(result.data.fees.map((f) => [f.serviceSlug, String(f.feeToman)])));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePromo(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        action: "upsert-promo",
        code: promoForm.code,
        percent: Number(promoForm.percent),
        title: promoForm.title,
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("کد تخفیف ذخیره شد.");
    setPromoForm({ code: "", percent: "10", title: "" });
    await load();
  }

  async function togglePromo(code: string, active: boolean) {
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "set-promo-active", code, active }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function saveFee(serviceSlug: string) {
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        action: "set-fee",
        serviceSlug,
        feeToman: Number(feeDraft[serviceSlug] ?? 0),
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("تعرفه به‌روز شد.");
    await load();
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <AdminHeading
        kicker="مالی"
        title="تعرفه و تخفیف"
        description="مدیریت کدهای تخفیف و مبلغ پایه سرویس‌ها."
      />

      <AdminErrorNote>{error}</AdminErrorNote>
      <AdminOkNote>{message}</AdminOkNote>

      <form onSubmit={savePromo} className={cn(panelCard, "grid gap-3 p-5 sm:grid-cols-3")}>
        <h2 className="sm:col-span-3 font-heading text-lg font-semibold">کد تخفیف</h2>
        <input
          required
          placeholder="کد"
          value={promoForm.code}
          onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value }))}
          className={cn(adminInputClass(), "mt-0")}
          dir="ltr"
        />
        <input
          required
          placeholder="درصد"
          value={promoForm.percent}
          onChange={(e) => setPromoForm((p) => ({ ...p, percent: e.target.value }))}
          className={cn(adminInputClass(), "mt-0")}
          dir="ltr"
        />
        <input
          placeholder="عنوان"
          value={promoForm.title}
          onChange={(e) => setPromoForm((p) => ({ ...p, title: e.target.value }))}
          className={cn(adminInputClass(), "mt-0")}
        />
        <button
          type="submit"
          disabled={pending}
          className="sm:col-span-3 w-fit rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-gold disabled:opacity-60"
        >
          ذخیره کد
        </button>
      </form>

      <ul className={cn(panelCard, "divide-y divide-navy/8 overflow-hidden p-0")}>
        {promos.map((promo) => (
          <li key={promo.code} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-medium" dir="ltr">
                {promo.code}
              </p>
              <p className="text-xs text-navy/45">
                {promo.title} · {toFaDigits(promo.percent)}٪
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void togglePromo(promo.code, !promo.active)}
              className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs"
            >
              {promo.active ? "غیرفعال" : "فعال"}
            </button>
          </li>
        ))}
      </ul>

      <AdminSectionCard title="تعرفه سرویس‌ها">
        <ul className="divide-y divide-navy/8">
          {fees.map((fee) => (
            <li key={fee.serviceSlug} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">{fee.title}</p>
                <p className="text-xs text-navy/45">{formatTomanAmount(fee.feeToman)}</p>
              </div>
              <div className="flex gap-2">
                <input
                  value={feeDraft[fee.serviceSlug] ?? ""}
                  onChange={(e) => setFeeDraft((p) => ({ ...p, [fee.serviceSlug]: e.target.value }))}
                  className={cn(adminInputClass(), "mt-0 w-32 py-1.5 text-xs")}
                  dir="ltr"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void saveFee(fee.serviceSlug)}
                  className="rounded-xl bg-navy px-3 py-1.5 text-xs text-gold disabled:opacity-60"
                >
                  ذخیره
                </button>
              </div>
            </li>
          ))}
        </ul>
      </AdminSectionCard>
    </div>
  );
}
