"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminErrorNote, AdminOkNote, adminFetch, adminInputClass, panelCard } from "@/components/admin/admin-ui";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LawyerOption = { slug: string; fullName: string; active: boolean };

type Proposal = {
  id: string;
  kindLabel: string;
  status: string;
  title: string;
  body: string;
  createdAt: string;
};

export function AdminRequestDesk({
  trackingCode,
  lawyers,
  currentLawyerSlug,
  proposals,
}: {
  trackingCode: string;
  lawyers: LawyerOption[];
  currentLawyerSlug?: string | null;
  proposals: Proposal[];
}) {
  const router = useRouter();
  const [lawyerSlug, setLawyerSlug] = useState(currentLawyerSlug ?? "");
  const [startChat, setStartChat] = useState(false);
  const [feeToman, setFeeToman] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("requested");
  const [note, setNote] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const activeLawyers = useMemo(() => lawyers.filter((item) => item.active && item.slug), [lawyers]);

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, trackingCode, ...extra }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("انجام شد.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? <AdminErrorNote>{error}</AdminErrorNote> : null}
      {message ? <AdminOkNote>{message}</AdminOkNote> : null}

      <div className={cn(panelCard, "space-y-3 p-5")}>
        <h2 className="font-heading text-base font-semibold text-navy">تخصیص وکیل</h2>
        <select
          value={lawyerSlug}
          onChange={(event) => setLawyerSlug(event.target.value)}
          className={adminInputClass()}
        >
          <option value="">انتخاب وکیل</option>
          {activeLawyers.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.fullName}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-navy/70">
          <input type="checkbox" checked={startChat} onChange={(event) => setStartChat(event.target.checked)} />
          شروع گفتگو همراه تخصیص
        </label>
        <button
          type="button"
          disabled={pending || !lawyerSlug}
          onClick={() => void run("assign", { lawyerSlug, startChat })}
          className={cn(buttonVariants(), "bg-navy text-white hover:bg-navy-mid")}
        >
          تخصیص به وکیل
        </button>
      </div>

      <div className={cn(panelCard, "space-y-3 p-5")}>
        <h2 className="font-heading text-base font-semibold text-navy">تصمیم مالی</h2>
        <input
          value={feeToman}
          onChange={(event) => setFeeToman(event.target.value)}
          className={adminInputClass()}
          placeholder="مبلغ به تومان"
        />
        <select
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value)}
          className={adminInputClass()}
        >
          <option value="unpaid">هنوز اعلام نشده</option>
          <option value="requested">از موکل خواسته شود</option>
          <option value="paid">پرداخت شده</option>
          <option value="waived">معاف</option>
          <option value="free">رایگان</option>
        </select>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={adminInputClass()}
          placeholder="یادداشت مالی برای موکل"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            void run("set-payment", { feeToman: Number(feeToman) || 0, paymentStatus, note })
          }
          className={cn(buttonVariants({ variant: "outline" }), "border-navy/15")}
        >
          ثبت تصمیم مالی
        </button>
      </div>

      <div className={cn(panelCard, "space-y-3 p-5")}>
        <h2 className="font-heading text-base font-semibold text-navy">پیشنهادهای وکیل</h2>
        {proposals.length === 0 ? (
          <p className="text-sm text-navy/50">موردی در انتظار نیست.</p>
        ) : (
          proposals.map((item) => (
            <div key={item.id} className="rounded-xl bg-navy/[0.03] p-3">
              <p className="text-xs text-gold-deep">
                {item.kindLabel} · {item.status}
              </p>
              <p className="mt-1 font-medium text-navy">{item.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-navy/70">{item.body}</p>
              {item.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void run("review-proposal", { proposalId: item.id, decision: "approve" })}
                    className={cn(buttonVariants({ size: "sm" }), "bg-navy text-white")}
                  >
                    تأیید
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void run("review-proposal", { proposalId: item.id, decision: "reject" })}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "border-navy/15")}
                  >
                    رد
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className={cn(panelCard, "space-y-3 p-5")}>
        <h2 className="font-heading text-base font-semibold text-navy">پایان پرونده و حذف مدارک</h2>
        <textarea
          value={closeNote}
          onChange={(event) => setCloseNote(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
          placeholder="جمع‌بندی نهایی که پس از تأیید برای موکل دیده می‌شود"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("close-purge", { note: closeNote })}
          className={cn(buttonVariants(), "bg-red-800 text-white hover:bg-red-900")}
        >
          تأیید پایان و حذف مدارک
        </button>
      </div>
    </div>
  );
}
