"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon, ZapIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { consultBaseFeeToman } from "@/lib/consult";
import { formatToman } from "@/lib/format";
import type { PublicUser } from "@/lib/store-types";
import { cn } from "@/lib/utils";

function subjectFromMessage(message: string) {
  const cleaned = message.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 80) return cleaned || "مشاوره فوری";
  return `${cleaned.slice(0, 77)}…`;
}

export function UrgentConsultWizard({ user }: { user: PublicUser | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fee = consultBaseFeeToman("urgent-consult", "urgent");

  async function submit() {
    if (!user) {
      setError("برای ثبت باید وارد حساب شوید.");
      return;
    }
    if (message.trim().length < 20) {
      setError("شرح کوتاه باید حداقل ۲۰ نویسه باشد.");
      return;
    }
    if (!consent) {
      setError("پذیرش محرمانگی الزامی است.");
      return;
    }

    setPending(true);
    setError(null);
    const response = await fetch("/api/consultations", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "text",
        service: "urgent-consult",
        lawyerMode: "assign",
        subject: subjectFromMessage(message),
        message: message.trim(),
        urgency: "urgent",
        caseStage: "before-sign",
        hasDocuments: "no",
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        consent: true,
        documentIds: [],
      }),
    });
    const payload = (await response.json()) as { trackingCode?: string; error?: string };
    setPending(false);
    if (!response.ok || !payload.trackingCode) {
      setError(payload.error ?? "ثبت درخواست انجام نشد.");
      return;
    }
    router.push(`/account/requests/${encodeURIComponent(payload.trackingCode)}/waiting`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-[1.35rem] border border-gold/30 bg-gold/10 px-5 py-4 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-medium text-gold-deep">
          <ZapIcon className="size-4" />
          مشاوره فوری — قبل از امضا
        </p>
        <p className="mt-2 text-sm leading-7 text-navy/70">
          موضوع را کوتاه بنویسید و پرداخت کنید. نحوه ارتباط (پیام، تماس یا تصویر) بر اساس صلاح‌دید وکیل
          مشخص می‌شود؛ مدارک را هم می‌توانید بعداً در گفتگو بفرستید.
        </p>
      </div>

      <section className="rounded-[1.35rem] border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
        <Label htmlFor="urgent-message">شرح کوتاه موضوع</Label>
        <Textarea
          id="urgent-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="چه چیزی جلوی شماست و تا کی باید تصمیم بگیرید؟"
          className="mt-2 min-h-32"
          maxLength={3000}
        />
        <p className="mt-2 text-xs text-navy/45">مدارک و جزئیات بیشتر را پس از اتصال می‌توانید در چت بفرستید.</p>
      </section>

      <section className="rounded-[1.35rem] border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-navy/45">مبلغ قابل پرداخت</p>
            <p className="mt-1 font-heading text-2xl font-bold text-navy">{formatToman(fee)}</p>
            <p className="mt-1 text-xs text-navy/45">پرداخت آزمایشی هنگام ثبت</p>
          </div>
          <CreditCardIcon className="size-8 text-gold" />
        </div>
        <label className="mt-5 flex items-start gap-2 text-sm leading-7 text-navy/70">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1"
          />
          <span>شرایط محرمانگی و استفاده از اطلاعات برای ارائه مشاوره را می‌پذیرم.</span>
        </label>
        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={pending || !user}
          onClick={() => void submit()}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-5 h-12 w-full bg-gold text-navy-deep hover:bg-gold-bright sm:w-auto sm:min-w-56 sm:px-8",
          )}
        >
          <ZapIcon className="size-4" />
          {pending ? "در حال ثبت…" : "پرداخت و یافتن وکیل"}
        </button>
      </section>
    </div>
  );
}
