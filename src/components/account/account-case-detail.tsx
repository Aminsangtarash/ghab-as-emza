"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon, EyeIcon } from "lucide-react";

import { ConsultDocumentList } from "@/components/consult/document-list";
import { DocumentPreviewModal } from "@/components/consult/document-preview-modal";
import { buttonVariants } from "@/components/ui/button";
import { caseEventKindMeta, caseStageMeta, caseStatusMeta, type ClientCase } from "@/lib/case-model";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AccountCaseDetail({ caseId }: { caseId: string }) {
  const [item, setItem] = useState<ClientCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<{
    documentId: string;
    title: string;
    mimeType?: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/account/cases/${caseId}`, { credentials: "include" });
      const payload = (await response.json()) as { item?: ClientCase; error?: string };
      if (!response.ok || !payload.item) {
        setError(payload.error ?? "پرونده بارگذاری نشد.");
        return;
      }
      setItem(payload.item);
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(action: "accept" | "decline") {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/account/cases/${caseId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "ثبت پاسخ انجام نشد.");
        return;
      }
      setNote("");
      await load();
    } finally {
      setPending(false);
    }
  }

  if (!item) {
    return <p className="text-sm text-navy/60">{error ?? "در حال بارگذاری پرونده…"}</p>;
  }

  return (
    <div className="min-w-0">
      <div className="rounded-[1.4rem] bg-navy px-5 py-6 text-white shadow-lg shadow-navy/20 sm:px-6">
        <p className="text-sm font-medium text-gold">پرونده {toFaDigits(item.caseNumber)}</p>
        <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
        <h1 className="mt-4 font-heading text-2xl font-bold">{item.title}</h1>
        <p className="mt-2 text-sm text-white/70">
          {item.lawyerName} · {caseStageMeta[item.stage]}
        </p>
        <span
          className={cn(
            "mt-4 inline-block rounded-full px-3 py-1 text-[11px] font-medium",
            caseStatusMeta[item.status].tone,
          )}
        >
          {caseStatusMeta[item.status].title}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-white/85 p-5 shadow-sm ring-1 ring-navy/8">
        <h2 className="font-heading text-base font-semibold text-navy">شرح و برنامه کار</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-navy/75">{item.summary}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Meta label="مرجع رسیدگی" value={item.authority ?? "ثبت نشده"} />
          <Meta label="شعبه" value={item.courtBranch ?? "ثبت نشده"} />
          <Meta label="شماره پرونده" value={item.fileNumber ? toFaDigits(item.fileNumber) : "ثبت نشده"} />
          <Meta label="حق‌الوکاله" value={formatTomanAmount(item.feeToman)} />
          {item.paidToman > 0 ? <Meta label="پرداخت‌شده" value={formatTomanAmount(item.paidToman)} /> : null}
          <Meta
            label="اقدام بعدی"
            value={
              item.nextActionAt
                ? `${item.nextActionNote ?? "—"} · ${formatFaDateTime(item.nextActionAt)}`
                : "ثبت نشده"
            }
          />
        </dl>
        {item.trackingCode ? (
          <Link
            href={`/account/requests/${encodeURIComponent(item.trackingCode)}`}
            className="mt-3 inline-block text-xs text-navy/50 hover:text-navy"
          >
            درخواست مرتبط: {toFaDigits(item.trackingCode)}
          </Link>
        ) : null}
      </div>

      {(item.trackingCode && item.documents.length > 0) || item.documentRequestItems.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-white/85 p-5 shadow-sm ring-1 ring-navy/8">
          <h2 className="font-heading text-base font-semibold text-navy">مدارک پرونده</h2>
          {item.trackingCode && item.documents.length > 0 ? (
            <ConsultDocumentList trackingCode={item.trackingCode} items={item.documents} />
          ) : null}
          {item.documentRequestItems.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {item.documentRequestItems.map((docItem) => (
                <li key={docItem.id} className="rounded-xl bg-paper/70 px-3 py-3 ring-1 ring-navy/8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm text-navy">
                      {docItem.status === "approved" ? <CheckIcon className="size-4 text-emerald-600" /> : null}
                      {docItem.title}
                    </p>
                    <span className="text-[11px] text-navy/50">
                      {docItem.status === "pending"
                        ? "در انتظار آپلود"
                        : docItem.status === "uploaded"
                          ? "در انتظار تأیید"
                          : docItem.status === "approved"
                            ? "تأیید شده"
                            : "رد شده"}
                    </span>
                  </div>
                  {docItem.documentId && item.trackingCode ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          documentId: docItem.documentId!,
                          title: docItem.title,
                          mimeType: docItem.documentMimeType,
                        })
                      }
                      className={cn(buttonVariants({ variant: "outline" }), "mt-3 h-9 border-navy/15 px-3 text-xs")}
                    >
                      <EyeIcon className="size-3.5" />
                      مشاهده
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {preview && item.trackingCode ? (
        <DocumentPreviewModal
          open
          onClose={() => setPreview(null)}
          trackingCode={item.trackingCode}
          documentId={preview.documentId}
          title={preview.title}
          mimeType={preview.mimeType}
        />
      ) : null}

      {item.status === "proposed" && (
        <div className="mt-4 rounded-2xl border border-gold/25 bg-gold/10 p-5">
          <h2 className="font-heading text-base font-semibold text-navy">پاسخ به پیشنهاد وکیل</h2>
          <p className="mt-1 text-sm leading-7 text-navy/70">
            با پذیرش، پرونده جاری می‌شود و مراحل آن را همین‌جا پیگیری می‌کنید. هزینه پرونده در دفتر تسویه می‌شود.
          </p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-3 min-h-20 w-full rounded-xl border border-navy/15 bg-white p-3 text-sm leading-7 outline-none ring-gold/40 focus:ring-2"
            maxLength={1000}
            placeholder="توضیح یا سؤال شما (اختیاری)"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void respond("accept")}
              className={cn(buttonVariants(), "h-11 bg-navy px-5 text-white hover:bg-navy-mid")}
            >
              پذیرش تشکیل پرونده
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void respond("decline")}
              className={cn(buttonVariants({ variant: "outline" }), "h-11 border-navy/15 px-5")}
            >
              فعلاً نمی‌خواهم
            </button>
          </div>
        </div>
      )}

      {item.closeNote ? (
        <div className="mt-4 rounded-2xl bg-white/85 p-5 shadow-sm ring-1 ring-navy/8">
          <h2 className="font-heading text-base font-semibold text-navy">جمع‌بندی نهایی</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-navy/75">{item.closeNote}</p>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl bg-white/85 p-5 shadow-sm ring-1 ring-navy/8">
        <h2 className="font-heading text-base font-semibold text-navy">روند پرونده</h2>
        {item.events.length === 0 ? (
          <p className="mt-3 text-sm text-navy/55">هنوز رویدادی ثبت نشده است.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {item.events.map((row) => (
              <li key={row.id} className="rounded-2xl bg-paper/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-navy">{row.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      caseEventKindMeta[row.kind].tone,
                    )}
                  >
                    {caseEventKindMeta[row.kind].title}
                  </span>
                </div>
                {row.body ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-navy/70">{row.body}</p>
                ) : null}
                <p className="mt-2 text-[11px] text-navy/40">
                  {row.happensAt ? `زمان: ${formatFaDateTime(row.happensAt)} · ` : ""}
                  {formatFaDateTime(row.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <Link
        href="/account/cases"
        className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-11 border-navy/15 px-5")}
      >
        بازگشت به پرونده‌ها
      </Link>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/8 bg-white px-3 py-2.5">
      <dt className="text-[11px] text-navy/45">{label}</dt>
      <dd className="mt-1 text-sm text-navy/80">{value}</dd>
    </div>
  );
}
