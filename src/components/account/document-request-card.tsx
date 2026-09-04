"use client";

import { useRef, useState } from "react";
import { CheckIcon, UploadIcon } from "lucide-react";

import { DocumentPreviewModal } from "@/components/consult/document-preview-modal";
import { buttonVariants } from "@/components/ui/button";
import type { ClientDocumentRequest, ClientDocumentRequestItem } from "@/lib/document-request-types";
import { formatFileSize, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusMeta: Record<ClientDocumentRequestItem["status"], { label: string; tone: string }> = {
  pending: { label: "در انتظار آپلود", tone: "bg-navy/5 text-navy/55" },
  uploaded: { label: "ارسال شد — در انتظار تأیید وکیل", tone: "bg-amber-50 text-amber-800" },
  approved: { label: "تأیید شد", tone: "bg-emerald-50 text-emerald-800" },
  rejected: { label: "رد شد — دوباره بارگذاری کنید", tone: "bg-red-50 text-red-700" },
};

export function DocumentRequestCard({
  request,
  viewer,
  onUpdated,
}: {
  request: ClientDocumentRequest;
  viewer: "user" | "lawyer";
  onUpdated: (request: ClientDocumentRequest) => void;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    documentId: string;
    title: string;
    mimeType?: string;
  } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(itemId: string, file: File) {
    setUploadingId(itemId);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(
        `/api/conversations/${request.conversationId}/document-requests/${itemId}/upload`,
        { method: "POST", credentials: "include", body },
      );
      const payload = (await response.json()) as {
        request?: ClientDocumentRequest;
        error?: string;
      };
      if (!response.ok || !payload.request) {
        setError(payload.error ?? "بارگذاری انجام نشد.");
        return;
      }
      onUpdated(payload.request);
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-gold/25 bg-gold/10 p-4 text-start">
      <p className="text-sm font-medium text-navy">درخواست مدارک از سوی وکیل</p>
      {request.note ? <p className="mt-1 text-xs leading-6 text-navy/60">{request.note}</p> : null}
      <ul className="mt-3 space-y-2">
        {request.items.map((item) => {
          const meta = statusMeta[item.status];
          const canUpload = viewer === "user" && item.status !== "approved";
          return (
            <li key={item.id} className="rounded-xl bg-white/90 px-3 py-3 ring-1 ring-navy/8">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm text-navy">
                    {item.status === "approved" ? <CheckIcon className="size-4 text-emerald-600" /> : null}
                    <span>{item.title}</span>
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
              <div className="mt-3 flex flex-wrap gap-2">
                {item.documentId ? (
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
                    مشاهده
                  </button>
                ) : null}
                {canUpload ? (
                  <>
                    <input
                      ref={(node) => {
                        inputRefs.current[item.id] = node;
                      }}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,image/*,application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void upload(item.id, file);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingId === item.id}
                      onClick={() => inputRefs.current[item.id]?.click()}
                      className={cn(buttonVariants(), "h-9 bg-navy px-3 text-xs text-white hover:bg-navy-mid")}
                    >
                      <UploadIcon className="size-3.5" />
                      {uploadingId === item.id
                        ? "در حال ارسال…"
                        : item.status === "rejected"
                          ? "بارگذاری مجدد"
                          : "انتخاب فایل"}
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-navy/45">
        پیشرفت: {toFaDigits(request.approvedCount)} تأیید از {toFaDigits(request.items.length)} مورد
      </p>
      {error ? (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {preview ? (
        <DocumentPreviewModal
          open
          onClose={() => setPreview(null)}
          trackingCode={request.trackingCode}
          documentId={preview.documentId}
          title={preview.title}
          mimeType={preview.mimeType}
        />
      ) : null}
    </div>
  );
}
