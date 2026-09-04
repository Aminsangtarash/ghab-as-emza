"use client";

import { useState } from "react";
import { CheckIcon, EyeIcon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";

import { DocumentPreviewModal } from "@/components/consult/document-preview-modal";
import { buttonVariants } from "@/components/ui/button";
import { FieldLabel, inputClass, panelFetch } from "@/components/lawyer/lawyer-ui";
import {
  DEFAULT_DOCUMENT_REQUEST_TITLES,
  type ClientDocumentRequest,
  type ClientDocumentRequestItem,
} from "@/lib/document-request-types";
import { formatFileSize, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusMeta: Record<
  ClientDocumentRequestItem["status"],
  { label: string; tone: string }
> = {
  pending: { label: "در انتظار آپلود", tone: "bg-navy/5 text-navy/55" },
  uploaded: { label: "آپلود شده", tone: "bg-amber-50 text-amber-800" },
  approved: { label: "تأیید شده", tone: "bg-emerald-50 text-emerald-800" },
  rejected: { label: "رد شده", tone: "bg-red-50 text-red-700" },
};

export function DocumentRequestEditor({
  conversationId,
  latest,
  onChanged,
  pending,
  setPending,
  setError,
  setOkMessage,
}: {
  conversationId: string;
  latest: ClientDocumentRequest | null;
  onChanged: (request: ClientDocumentRequest | null) => void;
  pending: boolean;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setOkMessage: (value: string | null) => void;
}) {
  const [titles, setTitles] = useState<string[]>([...DEFAULT_DOCUMENT_REQUEST_TITLES]);
  const [customTitle, setCustomTitle] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<{
    documentId: string;
    title: string;
    mimeType?: string;
  } | null>(null);

  function addTitle() {
    const next = customTitle.trim();
    if (!next) return;
    if (titles.some((item) => item === next)) {
      setError("این عنوان قبلاً در فهرست هست.");
      return;
    }
    setTitles((current) => [...current, next.slice(0, 160)]);
    setCustomTitle("");
  }

  async function sendRequest() {
    setPending(true);
    setError(null);
    setOkMessage(null);
    const result = await panelFetch<{ request: ClientDocumentRequest }>("/api/lawyer/document-requests", {
      method: "POST",
      body: JSON.stringify({ conversationId, titles, note }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChanged(result.data.request);
    setOkMessage("درخواست مدارک در گفتگو برای موکل ارسال شد.");
  }

  async function review(itemId: string, action: "approve" | "reject") {
    setPending(true);
    setError(null);
    const result = await panelFetch<{ request: ClientDocumentRequest }>(
      `/api/lawyer/document-requests/${itemId}/review`,
      {
        method: "POST",
        body: JSON.stringify({
          action,
          reason: action === "reject" ? "لطفاً فایل واضح‌تر یا مرتبط‌تری بارگذاری کنید." : undefined,
        }),
      },
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChanged(result.data.request);
    setOkMessage(action === "approve" ? "مدرک تأیید شد." : "مدرک رد شد و به موکل اطلاع داده می‌شود.");
  }

  return (
    <div className="rounded-2xl border border-navy/8 bg-paper/50 p-4">
      <FieldLabel>درخواست آپلود مدارک از کاربر</FieldLabel>
      <p className="mb-3 text-xs leading-6 text-navy/45">
        موارد پیش‌فرض را کم و زیاد کنید، عنوان‌های اختصاصی اضافه کنید و سپس درخواست را به گفتگو بفرستید.
      </p>

      <ul className="space-y-2">
        {titles.map((title, index) => (
          <li key={`${title}-${index}`} className="flex items-center gap-2">
            <input
              value={title}
              onChange={(event) =>
                setTitles((current) =>
                  current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                )
              }
              className={inputClass}
              maxLength={160}
            />
            <button
              type="button"
              onClick={() => setTitles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-red-700 hover:bg-red-50"
              aria-label="حذف از فهرست"
            >
              <Trash2Icon className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          value={customTitle}
          onChange={(event) => setCustomTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTitle();
            }
          }}
          className={inputClass}
          maxLength={160}
          placeholder="مثلاً: تصویر قولنامه ملک آقای مرادی"
        />
        <button
          type="button"
          onClick={addTitle}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 shrink-0 border-navy/15 px-3")}
        >
          <PlusIcon className="size-4" />
          افزودن
        </button>
      </div>

      <label className="mt-3 block">
        <FieldLabel>توضیح برای موکل (اختیاری)</FieldLabel>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={inputClass}
          maxLength={500}
          placeholder="مثلاً: تصاویر باید واضح و خوانا باشند"
        />
      </label>

      <button
        type="button"
        disabled={pending || titles.length === 0}
        onClick={() => void sendRequest()}
        className={cn(buttonVariants(), "mt-3 h-10 bg-navy px-5 text-white hover:bg-navy-mid")}
      >
        <UploadIcon className="size-4" />
        ارسال درخواست به گفتگو
      </button>

      {latest ? (
        <div className="mt-4 space-y-2 border-t border-navy/8 pt-4">
          <p className="text-xs font-medium text-navy/55">
            آخرین درخواست · تأییدشده {toFaDigits(latest.approvedCount)} از {toFaDigits(latest.items.length)}
          </p>
          {latest.items.map((item) => {
            const meta = statusMeta[item.status];
            return (
              <div key={item.id} className="rounded-xl border border-navy/8 bg-white px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm text-navy">
                      {item.status === "approved" ? <CheckIcon className="size-4 text-emerald-600" /> : null}
                      <span className="truncate">{item.title}</span>
                    </p>
                    {item.documentName ? (
                      <p className="mt-1 text-[11px] text-navy/45">
                        {item.documentName}
                        {item.documentSize ? ` · ${formatFileSize(item.documentSize)}` : ""}
                      </p>
                    ) : null}
                    {item.rejectReason ? (
                      <p className="mt-1 text-[11px] text-red-700">{item.rejectReason}</p>
                    ) : null}
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", meta.tone)}>
                    {meta.label}
                  </span>
                </div>
                {(item.status === "uploaded" || item.status === "approved" || item.status === "rejected") &&
                item.documentId ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          documentId: item.documentId!,
                          title: item.title,
                          mimeType: item.documentMimeType,
                        })
                      }
                      className={cn(buttonVariants({ variant: "outline" }), "h-9 border-navy/15 px-3 text-xs")}
                    >
                      <EyeIcon className="size-3.5" />
                      مشاهده
                    </button>
                    {item.status !== "approved" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void review(item.id, "approve")}
                        className={cn(buttonVariants(), "h-9 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700")}
                      >
                        تأیید
                      </button>
                    ) : null}
                    {item.status === "uploaded" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void review(item.id, "reject")}
                        className={cn(buttonVariants({ variant: "outline" }), "h-9 border-red-200 px-3 text-xs text-red-700")}
                      >
                        رد
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {preview && latest ? (
        <DocumentPreviewModal
          open
          onClose={() => setPreview(null)}
          trackingCode={latest.trackingCode}
          documentId={preview.documentId}
          title={preview.title}
          mimeType={preview.mimeType}
        />
      ) : null}
    </div>
  );
}
