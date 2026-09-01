"use client";

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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
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
      <div className="space-y-1.5">
        <Label htmlFor="fullName">نام</Label>
        <Input id="fullName" name="fullName" className="h-10" required />
        {fieldErrors.fullName && <p className="text-xs text-destructive">{fieldErrors.fullName}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">موبایل</Label>
        <Input id="phone" name="phone" className="h-10" dir="ltr" inputMode="numeric" required />
        {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject">موضوع</Label>
        <Input id="subject" name="subject" className="h-10" required />
        {fieldErrors.subject && <p className="text-xs text-destructive">{fieldErrors.subject}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">پیام</Label>
        <Textarea id="message" name="message" className="min-h-28" required />
        {fieldErrors.message && <p className="text-xs text-destructive">{fieldErrors.message}</p>}
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
          buttonVariants(),
          "h-11 bg-gold text-navy-deep hover:bg-gold-bright disabled:opacity-50",
        )}
      >
        {pending ? "در حال ارسال…" : "ارسال پیام"}
      </button>
    </form>
  );
}
