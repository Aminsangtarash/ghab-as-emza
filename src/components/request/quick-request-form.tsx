"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ShieldCheckIcon } from "lucide-react";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { PrivacyPromise } from "@/components/privacy-promise";
import { buttonVariants } from "@/components/ui/button";
import { catalogItemTitle, getCatalogItem } from "@/lib/legal-catalog";
import { cn } from "@/lib/utils";

type Channel = "text" | "phone" | "video";

function channelFromService(slug: string): Channel {
  if (slug === "consult-phone") return "phone";
  if (slug === "consult-video") return "video";
  return "text";
}

export function QuickRequestForm({
  serviceSlug,
  categoryTitle,
  embedded,
}: {
  serviceSlug: string;
  categoryTitle?: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const { user, status } = useAuth();
  const item = getCatalogItem(serviceSlug);
  const locked = status !== "user";
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const subject = useMemo(() => {
    const title = item?.title ?? catalogItemTitle(serviceSlug);
    return title.slice(0, 120);
  }, [item, serviceSlug]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status !== "user") return;
    setPending(true);
    setError("");
    try {
      const documentIds: string[] = [];
      if (files && files.length > 0) {
        for (const file of Array.from(files).slice(0, 5)) {
          const payload = new FormData();
          payload.append("file", file);
          const uploaded = await fetch("/api/consultations/documents", {
            method: "POST",
            credentials: "include",
            body: payload,
          });
          const uploadedJson = (await uploaded.json()) as { document?: { id: string }; error?: string };
          if (!uploaded.ok || !uploadedJson.document) {
            throw new Error(uploadedJson.error || "بارگذاری مدرک ناموفق بود.");
          }
          documentIds.push(uploadedJson.document.id);
        }
      }

      const channel = channelFromService(serviceSlug);
      const response = await fetch("/api/consultations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          service: serviceSlug,
          lawyerMode: "assign",
          subject,
          message,
          urgency: serviceSlug === "consult-urgent" ? "urgent" : "normal",
          caseStage: "other",
          city: city || undefined,
          hasDocuments: documentIds.length > 0 ? "yes" : "no",
          fullName: fullName || user?.fullName,
          phone: phone || user?.phone,
          consent,
          documentIds,
        }),
      });
      const json = (await response.json()) as { trackingCode?: string; error?: string };
      if (!response.ok || !json.trackingCode) {
        throw new Error(json.error || "ثبت درخواست ناموفق بود.");
      }
      router.push(`/account/requests/${json.trackingCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت درخواست ناموفق بود.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AuthDialog open={status === "guest"} />
      <form
        onSubmit={(event) => void submit(event)}
        className={cn(
          "rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/10 sm:p-8",
          locked && "pointer-events-none select-none opacity-40",
          embedded && "shadow-none ring-0 p-0 sm:p-0",
        )}
      >
        <p className="text-sm font-medium text-gold-deep">{categoryTitle ?? "ثبت درخواست"}</p>
        <h2 className="mt-2 font-heading text-xl font-semibold text-navy">{item?.title ?? "درخواست حقوقی"}</h2>
        <p className="mt-2 text-sm leading-7 text-navy/65">
          فقط موضوع را شرح دهید. درخواست ابتدا به مدیر می‌رسد و سپس به وکیل مناسب سپرده می‌شود. مبلغ را مدیر اعلام می‌کند.
        </p>

        <label className="mt-6 block text-sm font-medium text-navy">
          نام و نام خانوادگی
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-navy">
          موبایل
          <input
            required
            dir="ltr"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-navy">
          شهر (اختیاری)
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-navy">
          شرح موضوع
          <textarea
            required
            minLength={12}
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="ماجرا را ساده و کوتاه بنویسید. مدارک را می‌توانید همین‌جا یا بعداً بفرستید."
            className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3 py-3 text-sm leading-7"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-navy">
          مدارک (اختیاری)
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
            onChange={(event) => setFiles(event.target.files)}
            className="mt-2 block w-full text-sm text-navy/70"
          />
        </label>

        <label className="mt-5 flex items-start gap-2 text-sm leading-6 text-navy/75">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1"
            required
          />
          <span>
            شرایط محرمانگی را می‌پذیرم و می‌دانم پس از پایان پرونده، مدارک از سامانه حذف می‌شود.
          </span>
        </label>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={pending || locked}
          className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 bg-gold px-6 text-navy-deep hover:bg-gold-bright")}
        >
          {pending ? "در حال ثبت…" : "ثبت درخواست"}
        </button>
        {status === "guest" ? (
          <p className="mt-3 text-sm text-navy/55">برای ثبت، ابتدا وارد حساب شوید.</p>
        ) : null}
        <p className="mt-4 flex items-center gap-2 text-xs text-navy/50">
          <ShieldCheckIcon className="size-4 text-gold-deep" />
          وکیل تا تأیید مدیر این درخواست را نمی‌بیند.
        </p>
        <PrivacyPromise className="mt-5" />
        <p className="mt-4 text-xs text-navy/45">
          نیاز به موضوع دیگر دارید؟{" "}
          <Link href="/services" className="text-gold-deep hover:underline">
            بازگشت به خدمات
          </Link>
        </p>
      </form>
    </>
  );
}
