"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCardIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  PaperclipIcon,
  PhoneIcon,
  VideoIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";

import { ChoiceCard } from "@/components/consult/choice-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  consultBaseFeeToman,
  consultChannelMeta,
  consultChannels,
  type ConsultChannel,
} from "@/lib/consult";
import { formatFileSize, formatToman } from "@/lib/format";
import type { PublicUser } from "@/lib/store-types";
import { cn } from "@/lib/utils";

type UploadedDoc = { id: string; originalName: string; size: number };

export function UrgentConsultWizard({ user }: { user: PublicUser | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [channel, setChannel] = useState<ConsultChannel>("text");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fee = consultBaseFeeToman("urgent-consult", "urgent");

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/consultations/documents", {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const payload = (await response.json()) as {
          error?: string;
          document?: UploadedDoc;
        };
        if (!response.ok || !payload.document) {
          setError(payload.error ?? "آپلود فایل انجام نشد.");
          break;
        }
        setDocuments((current) => [...current, payload.document!]);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeDoc(id: string) {
    await fetch(`/api/consultations/documents/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDocuments((current) => current.filter((item) => item.id !== id));
  }

  async function submit() {
    if (!user) {
      setError("برای ثبت باید وارد حساب شوید.");
      return;
    }
    if (subject.trim().length < 5) {
      setError("موضوع را کمی دقیق‌تر بنویسید.");
      return;
    }
    if (message.trim().length < 20) {
      setError("شرح موضوع باید حداقل ۲۰ نویسه باشد.");
      return;
    }
    if (city.trim().length < 2) {
      setError("شهر خود را بنویسید تا وکلای هم‌شهر اولویت داشته باشند.");
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
        channel,
        service: "urgent-consult",
        lawyerMode: "assign",
        subject: subject.trim(),
        message: message.trim(),
        city: city.trim(),
        urgency: "urgent",
        caseStage: "before-sign",
        hasDocuments: documents.length > 0 ? "yes" : "no",
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        consent: true,
        documentIds: documents.map((item) => item.id),
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
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-[1.35rem] border border-gold/30 bg-gold/10 px-5 py-4 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-medium text-gold-deep">
          <ZapIcon className="size-4" />
          مشاوره فوری — قبل از امضا
        </p>
        <p className="mt-2 text-sm leading-7 text-navy/70">
          درخواست در صف وکلا پخش می‌شود و با اولین پذیرش وارد گفتگو می‌شوید. در ۵ دقیقه اول اولویت با
          وکلای هم‌شهر شماست؛ مبلغ هنگام ثبت دریافت می‌شود و اگر تا ۱۵ دقیقه وصل نشوید به کیف پول
          برمی‌گردد.
        </p>
      </div>

      <section className="rounded-[1.35rem] border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-navy">نحوه ارتباط</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {consultChannels.map((item) => {
            const Icon =
              item === "video" ? VideoIcon : item === "phone" ? PhoneIcon : MessageSquareTextIcon;
            return (
              <ChoiceCard
                key={item}
                selected={channel === item}
                onSelect={() => setChannel(item)}
                title={consultChannelMeta[item].title}
                hint={consultChannelMeta[item].hint}
                icon={<Icon className="size-5" />}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-navy">شرح موضوع</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="urgent-subject">موضوع</Label>
            <Input
              id="urgent-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="مثلاً: بررسی فوری قرارداد اجاره قبل از امضا"
              className="mt-1.5"
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="urgent-message">توضیح کوتاه</Label>
            <Textarea
              id="urgent-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="چه چیزی جلوی شماست؟ تا کی باید تصمیم بگیرید؟ چه بندی نگران‌تان کرده؟"
              className="mt-1.5 min-h-28"
              maxLength={3000}
            />
          </div>
          <div>
            <Label htmlFor="urgent-city">شهر شما</Label>
            <Input
              id="urgent-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="مثلاً تهران"
              className="mt-1.5"
              maxLength={40}
            />
            <p className="mt-1.5 text-xs text-navy/45">
              وکلای هم‌شهر در دقایق اول اولویت پذیرش دارند.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-navy">آپلود قرارداد یا مدرک</h2>
        <p className="mt-2 text-sm leading-7 text-navy/60">
          اختیاری است؛ اگر قرارداد جلوی شماست همین‌جا بفرستید تا وکیل سریع‌تر بررسی کند.
        </p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => void uploadFiles(event.target.files)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-4 h-11 border-navy/15",
          )}
        >
          <PaperclipIcon className="size-4" />
          {uploading ? "در حال آپلود…" : "انتخاب فایل"}
        </button>
        {documents.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {documents.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-navy/8 bg-paper/50 px-3 py-2.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileTextIcon className="size-4 shrink-0 text-navy/40" />
                  <span className="truncate">{item.originalName}</span>
                  <span className="shrink-0 text-xs text-navy/40">{formatFileSize(item.size)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void removeDoc(item.id)}
                  className="text-navy/40 hover:text-red-700"
                  aria-label="حذف فایل"
                >
                  <XIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
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
        <p className="mt-2 text-center text-xs text-navy/45 sm:text-start">
          مبلغ قابل پرداخت: {formatToman(fee)}
        </p>
      </section>
    </div>
  );
}
