"use client";

import { useState } from "react";
import {
  BriefcaseIcon,
  MapPinIcon,
  PhoneIcon,
  SendIcon,
  UserIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { cooperationSchema } from "@/lib/validations";

export function CooperateForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const raw = {
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      city: String(form.get("city") ?? ""),
      specialty: String(form.get("specialty") ?? ""),
      licenseNumber: String(form.get("licenseNumber") ?? ""),
      experienceYears: String(form.get("experienceYears") ?? "0"),
      bio: String(form.get("bio") ?? ""),
      message: String(form.get("message") ?? ""),
    };
    const parsed = cooperationSchema.safeParse(raw);
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
      const response = await fetch("/api/cooperate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "ارسال درخواست ناموفق بود.");
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
        <p className="font-heading text-lg font-semibold text-navy">درخواست همکاری ثبت شد</p>
        <p className="mt-2 text-sm leading-7 text-navy/75">
          پس از بررسی مدیریت، در صورت تأیید، حساب میز وکیل با همان شماره موبایل ساخته می‌شود و از طریق تماس یا پیام
          نتیجه اعلام خواهد شد.
        </p>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "mt-5")}
          onClick={() => setDone(false)}
        >
          ارسال درخواست دیگر
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-navy/8 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی" name="fullName" error={fieldErrors.fullName} icon={UserIcon} required />
        <Field
          label="موبایل"
          name="phone"
          error={fieldErrors.phone}
          icon={PhoneIcon}
          required
          dir="ltr"
          placeholder="09xxxxxxxxx"
        />
        <Field label="ایمیل (اختیاری)" name="email" error={fieldErrors.email} type="email" />
        <Field label="شهر" name="city" error={fieldErrors.city} icon={MapPinIcon} required />
        <Field label="تخصص اصلی" name="specialty" error={fieldErrors.specialty} icon={BriefcaseIcon} required />
        <Field label="شماره پروانه (اختیاری)" name="licenseNumber" error={fieldErrors.licenseNumber} />
        <Field
          label="سابقه (سال)"
          name="experienceYears"
          error={fieldErrors.experienceYears}
          type="number"
          defaultValue="1"
          dir="ltr"
        />
      </div>

      <div>
        <Label htmlFor="bio">معرفی کوتاه (اختیاری)</Label>
        <Textarea id="bio" name="bio" rows={3} className="mt-1.5" placeholder="سوابق و حوزه تمرکز…" />
        {fieldErrors.bio ? <p className="mt-1 text-xs text-red-600">{fieldErrors.bio}</p> : null}
      </div>

      <div>
        <Label htmlFor="message">انگیزه و نوع همکاری موردنظر</Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          required
          className="mt-1.5"
          placeholder="چرا می‌خواهید با قبل از امضا همکاری کنید و چه خدماتی ارائه می‌دهید؟"
        />
        {fieldErrors.message ? <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p> : null}
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants(), "w-full sm:w-auto")}
      >
        <SendIcon className="size-4" />
        {pending ? "در حال ارسال…" : "ارسال درخواست همکاری"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  icon: Icon,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  name: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="relative mt-1.5">
        {Icon ? <Icon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /> : null}
        <Input id={name} name={name} className={Icon ? "ps-9" : undefined} {...props} />
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
