"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { panelHome } from "@/lib/account";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

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
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    setPending(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const body =
      mode === "register"
        ? {
            fullName: String(form.get("fullName") ?? ""),
            phone: String(form.get("phone") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            phone: String(form.get("phone") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; user?: { role?: string } };
      if (!response.ok) {
        setMessage(payload.error ?? "ورود یا ثبت نام انجام نشد.");
        return;
      }
      await refresh();
      if (variant === "page") {
        router.push(nextHref || panelHome(payload.user?.role));
        router.refresh();
      }
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
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
    <form onSubmit={onSubmit} className="space-y-4" method="post">
      {mode === "register" && (
        <div className="space-y-1.5">
          <Label htmlFor="auth-fullName">نام و نام خانوادگی</Label>
          <Input id="auth-fullName" name="fullName" className="h-10" autoComplete="name" required />
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
          autoComplete="username"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="auth-password">رمز عبور</Label>
        <Input
          id="auth-password"
          name="password"
          type="password"
          className="h-10"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
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
        {pending ? "در حال بررسی…" : mode === "login" ? "ورود" : "ایجاد حساب"}
      </button>
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
    </form>
  );
}
