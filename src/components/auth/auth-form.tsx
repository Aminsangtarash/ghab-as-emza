"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { OtpInput } from "@/components/auth/otp-input";
import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { panelHome } from "@/lib/account";
import { OTP_LENGTH } from "@/lib/otp-constants";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";
type Step = "phone" | "otp";

export function AuthForm({
  mode,
  variant = "page",
  nextHref,
  onModeChange,
}: {
  mode: AuthMode;
  variant?: "page" | "dialog";
  nextHref?: string;
  onModeChange?: (mode: AuthMode) => void;
}) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [retryAfterSec, setRetryAfterSec] = useState(0);

  useEffect(() => {
    setStep("phone");
    setOtp("");
    setMessage(null);
    setRetryAfterSec(0);
  }, [mode]);

  useEffect(() => {
    if (retryAfterSec <= 0) return;
    const timer = window.setTimeout(() => setRetryAfterSec((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfterSec]);

  async function finishAuth(userRole?: string) {
    await refresh();
    if (variant === "page") {
      router.push(nextHref || panelHome(userRole));
      router.refresh();
    }
  }

  async function sendOtp() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: mode,
          phone,
          ...(mode === "register" ? { fullName } : {}),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        retryAfterSec?: number;
      };
      if (!response.ok) {
        setMessage(payload.error ?? "ارسال کد انجام نشد.");
        if (payload.retryAfterSec) setRetryAfterSec(payload.retryAfterSec);
        return;
      }
      setStep("otp");
      setOtp("");
      setRetryAfterSec(payload.retryAfterSec ?? 60);
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(code = otp) {
    if (code.length !== OTP_LENGTH || pending) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: mode,
          phone,
          code,
          ...(mode === "register" ? { fullName } : {}),
        }),
      });
      const payload = (await response.json()) as { error?: string; user?: { role?: string } };
      if (!response.ok) {
        setMessage(payload.error ?? "تأیید کد انجام نشد.");
        return;
      }
      await finishAuth(payload.user?.role);
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  async function onPhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    await sendOtp();
  }

  async function onOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    await verifyOtp();
  }

  const switchHref =
    mode === "login"
      ? nextHref
        ? `/register?next=${encodeURIComponent(nextHref)}`
        : "/register"
      : nextHref
        ? `/login?next=${encodeURIComponent(nextHref)}`
        : "/login";

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <form onSubmit={(event) => void onPhoneSubmit(event)} className="space-y-4" method="post">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-fullName">نام و نام خانوادگی</Label>
              <Input
                id="auth-fullName"
                name="fullName"
                className="h-10"
                autoComplete="name"
                required
                minLength={3}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="auth-phone">شماره موبایل</Label>
            <Input
              id="auth-phone"
              name="phone"
              className="h-10"
              dir="ltr"
              inputMode="numeric"
              placeholder="0912xxxxxxx"
              autoComplete="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          {message && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-7 text-red-800" role="alert">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className={cn(
              buttonVariants(),
              "h-11 w-full bg-navy text-white hover:bg-navy-mid disabled:opacity-50",
            )}
          >
            {pending ? "در حال ارسال…" : "ارسال کد تأیید"}
          </button>
        </form>
      ) : (
        <form onSubmit={(event) => void onOtpSubmit(event)} className="space-y-4" method="post">
          <div className="rounded-xl bg-navy/[0.03] px-3 py-3 text-sm leading-7 text-navy/75">
            کد ۵ رقمی به{" "}
            <span className="font-medium text-navy" dir="ltr">
              {phone}
            </span>{" "}
            ارسال شد.
            <button
              type="button"
              className="mr-2 font-medium text-gold-deep hover:text-navy"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setMessage(null);
              }}
            >
              ویرایش شماره
            </button>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="auth-otp-0">کد تأیید</Label>
            <OtpInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setMessage(null);
                if (value.length === OTP_LENGTH) {
                  void verifyOtp(value);
                }
              }}
              disabled={pending}
              autoFocus
              aria-invalid={Boolean(message)}
            />
          </div>
          {message && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-7 text-red-800" role="alert">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || otp.length !== OTP_LENGTH}
            className={cn(
              buttonVariants(),
              "h-11 w-full bg-navy text-white hover:bg-navy-mid disabled:opacity-50",
            )}
          >
            {pending ? "در حال بررسی…" : mode === "login" ? "ورود" : "ایجاد حساب"}
          </button>
          <button
            type="button"
            disabled={pending || retryAfterSec > 0}
            onClick={() => void sendOtp()}
            className="w-full text-center text-sm font-medium text-navy/70 transition hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retryAfterSec > 0 ? `ارسال مجدد تا ${retryAfterSec} ثانیه دیگر` : "ارسال مجدد کد"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-navy/70">
        {mode === "login" ? (
          <>
            حساب ندارید؟{" "}
            {variant === "dialog" ? (
              <button
                type="button"
                className="font-medium text-navy hover:text-gold-deep"
                onClick={() => onModeChange?.("register")}
              >
                ثبت نام
              </button>
            ) : (
              <Link href={switchHref} className="font-medium text-navy hover:text-gold-deep">
                ثبت نام
              </Link>
            )}
          </>
        ) : (
          <>
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            {variant === "dialog" ? (
              <button
                type="button"
                className="font-medium text-navy hover:text-gold-deep"
                onClick={() => onModeChange?.("login")}
              >
                ورود
              </button>
            ) : (
              <Link href={switchHref} className="font-medium text-navy hover:text-gold-deep">
                ورود
              </Link>
            )}
          </>
        )}
      </p>
    </div>
  );
}
