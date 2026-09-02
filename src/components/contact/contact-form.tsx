"use client";

import type { LucideIcon } from "lucide-react";
import {
  MailIcon,
  PencilIcon,
  PhoneIcon,
  SendIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { contactSchema } from "@/lib/validations";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const formElement = event.currentTarget;
    setError(null);
    setFieldErrors({});
    const form = new FormData(formElement);
    const raw = {
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
    };
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "ارسال پیام ناموفق بود.");
        return;
      }
      formElement.reset();
      setDone(true);
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-paper p-6 ring-1 ring-navy/8">
        <p className="font-heading text-lg font-semibold text-navy">پیام شما دریافت شد</p>
        <p className="mt-2 text-sm leading-7 text-navy/75">
          در ساعات کاری با شما تماس می‌گیریم. برای موضوع حقوقی فوری از مشاوره آنلاین استفاده کنید.
        </p>
        <button
          type="button"
          className={cn(buttonVariants(), "mt-4 h-10 bg-navy text-white hover:bg-navy-mid")}
          onClick={() => setDone(false)}
        >
          ارسال پیام دیگر
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate method="post">
      <IconField
        id="fullName"
        name="fullName"
        label="نام و نام خانوادگی"
        icon={UserIcon}
        error={fieldErrors.fullName}
        required
      />
      <IconField
        id="phone"
        name="phone"
        label="شماره موبایل"
        icon={PhoneIcon}
        error={fieldErrors.phone}
        ltr
        inputMode="numeric"
        required
      />
      <IconField
        id="email"
        name="email"
        label="ایمیل (اختیاری)"
        icon={MailIcon}
        error={fieldErrors.email}
        type="email"
        ltr
      />
      <IconField
        id="subject"
        name="subject"
        label="موضوع"
        icon={TagIcon}
        error={fieldErrors.subject}
        required
      />
      <div>
        <Label htmlFor="message" className="sr-only">
          پیام
        </Label>
        <div className="relative">
          <PencilIcon className="pointer-events-none absolute top-4 right-3.5 size-4 text-navy/35" />
          <Textarea
            id="message"
            name="message"
            placeholder="پیام"
            required
            aria-invalid={Boolean(fieldErrors.message)}
            className="min-h-32 rounded-xl py-3.5 pr-11"
          />
        </div>
        {fieldErrors.message && (
          <p className="mt-1.5 text-xs text-destructive">{fieldErrors.message}</p>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 gap-2 bg-navy px-6 text-white hover:bg-navy-mid disabled:opacity-50",
        )}
      >
        <SendIcon className="size-4 text-gold" />
        {pending ? "در حال ارسال…" : "ارسال پیام"}
      </button>
    </form>
  );
}

function IconField({
  id,
  name,
  label,
  icon: Icon,
  error,
  type = "text",
  ltr,
  inputMode,
  required,
}: {
  id: string;
  name: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  type?: string;
  ltr?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-navy/35" />
        <Input
          id={id}
          name={name}
          type={type}
          dir={ltr ? "ltr" : undefined}
          inputMode={inputMode}
          placeholder={label}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn("h-12 rounded-xl pr-11", ltr && "text-right")}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
