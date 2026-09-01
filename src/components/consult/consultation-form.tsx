"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteSelect } from "@/components/ui/site-select";
import { services } from "@/lib/data";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { consultationSchema } from "@/lib/validations";

type Status =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "success"; trackingCode: string };

export function ConsultationForm({ defaultService }: { defaultService?: string }) {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const formElement = event.currentTarget;
    setStatus({ type: "idle" });
    setFieldErrors({});

    const form = new FormData(formElement);
    const raw = {
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      service: String(form.get("service") ?? ""),
      message: String(form.get("message") ?? ""),
    };

    const parsed = consultationSchema.safeParse(raw);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setStatus({ type: "error", message: "لطفاً موارد مشخص‌شده را اصلاح کنید." });
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as {
        trackingCode?: string;
        error?: string;
      };
      if (!response.ok || !payload.trackingCode) {
        setStatus({
          type: "error",
          message: payload.error ?? "ارسال درخواست با خطا روبه‌رو شد. دوباره تلاش کنید.",
        });
        return;
      }
      formElement.reset();
      setStatus({ type: "success", trackingCode: payload.trackingCode });
    } catch {
      setStatus({
        type: "error",
        message: "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.",
      });
    } finally {
      setPending(false);
    }
  }

  if (status.type === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-heading text-lg font-semibold text-navy">درخواست شما ثبت شد</p>
        <p className="mt-2 text-sm leading-7 text-navy/75">
          کد پیگیری را نزد خود نگه دارید. همکاران ما در ساعات کاری با شما تماس می‌گیرند.
        </p>
        <p className="mt-4 font-heading text-2xl tracking-wide text-gold-deep" dir="ltr">
          {toFaDigits(status.trackingCode)}
        </p>
        <button
          type="button"
          className={cn(buttonVariants(), "mt-6 h-10 bg-navy text-white hover:bg-navy-mid")}
          onClick={() => setStatus({ type: "idle" })}
        >
          ثبت درخواست جدید
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate method="post">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی" htmlFor="fullName" error={fieldErrors.fullName}>
          <Input id="fullName" name="fullName" className="h-10" autoComplete="name" required />
        </Field>
        <Field label="شماره موبایل" htmlFor="phone" error={fieldErrors.phone}>
          <Input
            id="phone"
            name="phone"
            className="h-10"
            inputMode="numeric"
            dir="ltr"
            placeholder="0912xxxxxxx"
            autoComplete="tel"
            required
          />
        </Field>
      </div>
      <Field label="ایمیل (اختیاری)" htmlFor="email" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          className="h-10"
          dir="ltr"
          autoComplete="email"
        />
      </Field>
      <Field label="نوع خدمت" htmlFor="service" error={fieldErrors.service}>
        <SiteSelect
          id="service"
          name="service"
          required
          placeholder="انتخاب کنید"
          defaultValue={defaultService ?? null}
          options={services.map((service) => ({
            value: service.slug,
            label: service.title,
          }))}
        />
      </Field>
      <Field label="شرح موضوع" htmlFor="message" error={fieldErrors.message}>
        <Textarea
          id="message"
          name="message"
          className="min-h-32"
          placeholder="موضوع را بدون ارسال مدارک محرمانه به‌صورت خلاصه بنویسید."
          required
        />
      </Field>
      <p className="text-xs leading-6 text-navy/60">
        اطلاعات فقط برای پاسخ به همین درخواست استفاده می‌شود. تا پیش از هماهنگی، سند هویتی یا قرارداد کامل ارسال نکنید.
      </p>
      {status.type === "error" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-11 w-full bg-gold text-navy-deep hover:bg-gold-bright disabled:opacity-50 sm:w-auto sm:px-8",
        )}
      >
        {pending ? "در حال ارسال…" : "ثبت درخواست مشاوره"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
