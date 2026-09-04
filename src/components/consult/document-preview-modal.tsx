"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentPreviewModal({
  open,
  onClose,
  trackingCode,
  documentId,
  title,
  mimeType,
}: {
  open: boolean;
  onClose: () => void;
  trackingCode: string;
  documentId: string;
  title: string;
  mimeType?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setUrl(null);
      try {
        const response = await fetch(
          `/api/consultations/${encodeURIComponent(trackingCode)}/documents/${documentId}?inline=1`,
          { credentials: "include" },
        );
        if (!response.ok) {
          throw new Error("فایل بارگذاری نشد.");
        }
        const blob = await response.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setUrl(objectUrl);
      } catch {
        if (!cancelled) setError("پیش‌نمایش فایل در دسترس نیست.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, trackingCode, documentId]);

  if (!open) return null;

  const isImage = Boolean(mimeType?.startsWith("image/"));
  const isPdf = mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.4rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-navy/10 px-4 py-3">
          <p className="min-w-0 truncate font-heading text-sm font-semibold text-navy">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl bg-navy/5 text-navy/70 hover:bg-navy/10"
            aria-label="بستن"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="min-h-[20rem] flex-1 overflow-auto bg-paper/60 p-4">
          {loading ? <p className="text-sm text-navy/50">در حال آماده‌سازی پیش‌نمایش…</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {url && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={title} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain" />
          ) : null}
          {url && isPdf ? (
            <iframe title={title} src={url} className="h-[70vh] w-full rounded-xl bg-white" />
          ) : null}
          {url && !isImage && !isPdf ? (
            <div className="space-y-3 text-sm text-navy/70">
              <p>پیش‌نمایش این نوع فایل در مرورگر پشتیبانی نمی‌شود.</p>
              <a
                href={url}
                download
                className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-10 border-navy/15 px-4")}
              >
                دانلود فایل
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
