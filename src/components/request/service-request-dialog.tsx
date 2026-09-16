"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { catalogItemTitle, getCatalogItem } from "@/lib/legal-catalog";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

function channelFromService(slug: string) {
  if (slug === "consult-phone") return "phone" as const;
  if (slug === "consult-video") return "video" as const;
  return "text" as const;
}

export function ServiceRequestDialog({
  open,
  serviceSlug,
  onOpenChange,
}: {
  open: boolean;
  serviceSlug: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const item = serviceSlug ? getCatalogItem(serviceSlug) : undefined;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title ?? (serviceSlug ? catalogItemTitle(serviceSlug) : ""));
    setMessage("");
    setError("");
    setPending(false);
  }, [open, item?.title, serviceSlug]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !serviceSlug) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channelFromService(serviceSlug),
          service: serviceSlug,
          lawyerMode: "assign",
          subject: title,
          message,
          urgency: serviceSlug === "consult-urgent" ? "urgent" : "normal",
          caseStage: "other",
          hasDocuments: "no",
          fullName: user.fullName,
          phone: user.phone,
          consent: true,
        }),
      });
      const json = (await response.json()) as { trackingCode?: string; error?: string };
      if (!response.ok || !json.trackingCode) {
        throw new Error(json.error || "ثبت درخواست ناموفق بود.");
      }
      onOpenChange(false);
      router.push(`/account/requests/${json.trackingCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت درخواست ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup className="relative my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-navy/10 outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gold-deep">ثبت سریع درخواست</p>
                <Dialog.Title className="mt-1 font-heading text-xl font-bold text-navy">
                  {item?.title ?? "درخواست حقوقی"}
                </Dialog.Title>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-navy/10 text-navy/60 hover:text-navy"
                aria-label="بستن"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
            <Dialog.Description className="mt-3 text-sm leading-7 text-navy/70">
              فقط عنوان و یک توضیح کوتاه کافی است. درخواست با شماره {user ? toFaDigits(user.phone) : "ورودشده"} ثبت
              می‌شود و ابتدا به مدیر می‌رسد.
            </Dialog.Description>

            <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-navy">
                عنوان درخواست
                <input
                  required
                  minLength={3}
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-navy">
                توضیح کوتاه
                <textarea
                  required
                  minLength={8}
                  maxLength={3000}
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="موضوع را خیلی کوتاه بنویسید."
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3 py-3 text-sm leading-7"
                />
              </label>
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <button
                type="submit"
                disabled={pending || !user}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 w-full bg-gold text-navy-deep hover:bg-gold-bright",
                )}
              >
                {pending ? "در حال ثبت…" : "ثبت درخواست"}
              </button>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
