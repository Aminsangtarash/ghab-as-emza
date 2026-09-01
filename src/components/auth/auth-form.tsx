"use client";

import { useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "").replace(/[\s-]/g, "");
    if (!/^09\d{9}$/.test(phone)) {
      setMessage("شماره موبایل را به‌صورت 09121234567 وارد کنید.");
      setPending(false);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    setPending(false);
    setMessage(
      "حساب کاربری در مرحله بعد به MySQL و احراز هویت امن متصل می‌شود. برای دریافت مشاوره، از فرم مشاوره آنلاین استفاده کنید.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" method="post">
      {mode === "register" && (
        <div className="space-y-1.5">
          <Label htmlFor="fullName">نام و نام خانوادگی</Label>
          <Input id="fullName" name="fullName" className="h-10" required />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="phone">شماره موبایل</Label>
        <Input
          id="phone"
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
        <Label htmlFor="password">رمز عبور</Label>
        <Input id="password" name="password" type="password" className="h-10" autoComplete="current-password" required minLength={8} />
      </div>
      {message && (
        <p className="rounded-lg bg-navy/5 px-3 py-2 text-sm leading-7 text-navy" role="status">
          {message}{" "}
          <Link href="/consult" className="font-medium text-gold-deep hover:underline">
            درخواست مشاوره
          </Link>
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
            <Link href="/register" className="font-medium text-navy hover:text-gold-deep">
              ثبت نام
            </Link>
          </>
        ) : (
          <>
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link href="/login" className="font-medium text-navy hover:text-gold-deep">
              ورود
            </Link>
          </>
        )}
      </p>
      <Link
        href="/consult"
        className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full border-navy/20")}
      >
        ادامه بدون حساب؛ درخواست مشاوره
      </Link>
    </form>
  );
}
