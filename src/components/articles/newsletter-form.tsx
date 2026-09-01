"use client";

import { useState, type FormEvent } from "react";
import { MailIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <div className="rounded-2xl bg-navy p-5 text-white shadow-lg">
      <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-gold/15 text-gold">
        <MailIcon className="size-5" />
      </span>
      <h3 className="font-heading text-base font-bold">عضویت در خبرنامه</h3>
      <p className="mt-2 text-sm leading-7 text-white/75">
        خلاصه مقالات و نکته‌های کاربردی را هر هفته دریافت کنید.
      </p>
      {sent ? (
        <p className="mt-5 rounded-xl bg-white/10 px-3 py-3 text-sm text-gold">
          ایمیل شما ثبت شد. به‌زودی برای شما می‌نویسیم.
        </p>
      ) : (
        <form className="mt-5 space-y-2" onSubmit={onSubmit}>
          <Input
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
            className="h-11 border-white/15 bg-white text-navy"
          />
          <button
            type="submit"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 w-full bg-gold text-navy-deep hover:bg-gold-bright",
            )}
          >
            عضویت
          </button>
        </form>
      )}
    </div>
  );
}
