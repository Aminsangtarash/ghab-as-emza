"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseIcon,
  MapPinIcon,
  PhoneIcon,
  SendIcon,
  UserIcon,
} from "lucide-react";

import { OtpInput } from "@/components/auth/otp-input";
import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toFaDigits } from "@/lib/format";
import { OTP_LENGTH } from "@/lib/otp-constants";
import { cn } from "@/lib/utils";
import { cooperationSchema, type CooperationInput } from "@/lib/validations";

type Step = "form" | "otp";

export function CooperateForm() {
  const { user, status } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [draft, setDraft] = useState<CooperationInput | null>(null);
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [retryAfterSec, setRetryAfterSec] = useState(0);

  useEffect(() => {
    if (retryAfterSec <= 0) return;
    const timer = window.setTimeout(() => setRetryAfterSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfterSec]);

  function resetFlow() {
    setDone(false);
    setStep("form");
    setDraft(null);
    setOtp("");
    setError(null);
    setFieldErrors({});
  }

  async function submitApplication(payload: CooperationInput & { otpCode?: string }) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/cooperate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "ارسال درخواست ناموفق بود.");
        return false;
      }
      setDone(true);
      setStep("form");
      setDraft(null);
      setOtp("");
      return true;
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function sendOtp(phone: string) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "cooperate", phone }),
      });
      const data = (await response.json()) as { error?: string; retryAfterSec?: number };
      if (!response.ok) {
        setError(data.error ?? "ارسال کد تأیید انجام نشد.");
        if (data.retryAfterSec) setRetryAfterSec(data.retryAfterSec);
        return false;
      }
      setStep("otp");
      setOtp("");
      setRetryAfterSec(data.retryAfterSec ?? 60);
      return true;
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    setDraft(parsed.data);

    const phoneVerifiedBySession =
      status === "authenticated" &&
      user?.active !== false &&
      user.phone === parsed.data.phone;

    if (phoneVerifiedBySession) {
      await submitApplication(parsed.data);
      return;
    }

    await sendOtp(parsed.data.phone);
  }

  async function onOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || otp.length !== OTP_LENGTH || pending) return;
    await submitApplication({ ...draft, otpCode: otp });
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-paper p-6 ring-1 ring-navy/8">
        <p className="font-heading text-lg font-semibold text-navy">درخواست همکاری ثبت شد</p>
        <p className="mt-2 text-sm leading-7 text-navy/75">
          پس از بررسی مدیریت، در صورت تأیید، حساب میز وکیل با همان شماره موبایل ساخته می‌شود و از طریق تماس یا پیام
          نتیجه اعلام خواهد شد.
        </p>
        <button type="button" className={cn(buttonVariants({ variant: "outline" }), "mt-5")} onClick={resetFlow}>
          ارسال درخواست دیگر
        </button>
      </div>
    );
  }

  if (step === "otp" && draft) {
    return (
      <form onSubmit={(e) => void onOtpSubmit(e)} className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-navy/8 sm:p-6">
        <div>
          <p className="font-heading text-lg font-semibold text-navy">تأیید شماره موبایل</p>
          <p className="mt-2 text-sm leading-7 text-navy/65">
            کد ۵ رقمی ارسال‌شده به{" "}
            <span className="font-medium text-navy" dir="ltr">
              {toFaDigits(draft.phone)}
            </span>{" "}
            را وارد کنید تا درخواست همکاری ثبت شود.
          </p>
        </div>

        <div>
          <Label htmlFor="cooperate-otp-0">کد تأیید</Label>
          <div className="mt-2">
            <OtpInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (value.length === OTP_LENGTH && draft && !pending) {
                  void submitApplication({ ...draft, otpCode: value });
                }
              }}
              disabled={pending}
              autoFocus
              aria-invalid={Boolean(error)}
            />
          </div>
        </div>

        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending || otp.length !== OTP_LENGTH}
            className={cn(buttonVariants(), "w-full sm:w-auto")}
          >
            <SendIcon className="size-4" />
            {pending ? "در حال ثبت…" : "تأیید و ثبت درخواست"}
          </button>
          <button
            type="button"
            disabled={pending || retryAfterSec > 0}
            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
            onClick={() => void sendOtp(draft.phone)}
          >
            {retryAfterSec > 0 ? `ارسال مجدد تا ${toFaDigits(retryAfterSec)} ثانیه` : "ارسال مجدد کد"}
          </button>
          <button
            type="button"
            disabled={pending}
            className={cn(buttonVariants({ variant: "ghost" }), "w-full sm:w-auto")}
            onClick={() => {
              setStep("form");
              setOtp("");
              setError(null);
            }}
          >
            ویرایش فرم
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void onFormSubmit(e)} className="space-y-4 rounded-2xl bg-paper p-5 ring-1 ring-navy/8 sm:p-6">
      <p className="rounded-xl bg-navy/[0.04] px-3 py-2 text-xs leading-6 text-navy/60">
        برای جلوگیری از ثبت شماره جعلی، پس از تکمیل فرم یک کد تأیید پیامکی به موبایل شما ارسال می‌شود.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="نام و نام خانوادگی"
          name="fullName"
          error={fieldErrors.fullName}
          icon={UserIcon}
          required
          defaultValue={draft?.fullName}
        />
        <Field
          label="موبایل"
          name="phone"
          error={fieldErrors.phone}
          icon={PhoneIcon}
          required
          dir="ltr"
          placeholder="09xxxxxxxxx"
          defaultValue={draft?.phone ?? (status === "authenticated" ? user?.phone : undefined)}
        />
        <Field label="ایمیل (اختیاری)" name="email" error={fieldErrors.email} type="email" defaultValue={draft?.email} />
        <Field
          label="شهر"
          name="city"
          error={fieldErrors.city}
          icon={MapPinIcon}
          required
          defaultValue={draft?.city}
        />
        <Field
          label="تخصص اصلی"
          name="specialty"
          error={fieldErrors.specialty}
          icon={BriefcaseIcon}
          required
          defaultValue={draft?.specialty}
        />
        <Field
          label="شماره پروانه (اختیاری)"
          name="licenseNumber"
          error={fieldErrors.licenseNumber}
          defaultValue={draft?.licenseNumber}
        />
        <Field
          label="سابقه (سال)"
          name="experienceYears"
          error={fieldErrors.experienceYears}
          type="number"
          defaultValue={draft ? String(draft.experienceYears) : "1"}
          dir="ltr"
        />
      </div>

      <div>
        <Label htmlFor="bio">معرفی کوتاه (اختیاری)</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          className="mt-1.5"
          placeholder="سوابق و حوزه تمرکز…"
          defaultValue={draft?.bio}
        />
        {fieldErrors.bio ? <p className="mt-1 text-xs text-red-600">{fieldErrors.bio}</p> : null}
      </div>

      <div>
        <Label htmlFor="message" className={fieldErrors.message ? "text-red-700" : undefined}>
          انگیزه و نوع همکاری موردنظر
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-invalid={Boolean(fieldErrors.message)}
          className={cn("mt-1.5", fieldErrors.message && "border-red-400 bg-red-50/40 ring-2 ring-red-200/70")}
          placeholder="چرا می‌خواهید با قبل از امضا همکاری کنید و چه خدماتی ارائه می‌دهید؟"
          defaultValue={draft?.message}
        />
        {fieldErrors.message ? <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p> : null}
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button type="submit" disabled={pending} className={cn(buttonVariants(), "w-full sm:w-auto")}>
        <SendIcon className="size-4" />
        {pending ? "لطفاً صبر کنید…" : "ادامه و تأیید موبایل"}
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
      <Label htmlFor={name} className={error ? "text-red-700" : undefined}>
        {label}
      </Label>
      <div className="relative mt-1.5">
        {Icon ? <Icon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /> : null}
        <Input
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          className={cn(Icon ? "ps-9" : undefined, error && "border-red-400 bg-red-50/40 ring-2 ring-red-200/70")}
          {...props}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
