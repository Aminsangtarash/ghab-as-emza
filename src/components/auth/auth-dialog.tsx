"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";

import { AuthForm } from "@/components/auth/auth-form";

export function AuthDialog({ open }: { open: boolean }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <Dialog.Root open={open} modal disablePointerDismissal onOpenChange={() => undefined}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup className="relative my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-navy/10 outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
            <p className="text-sm font-medium text-gold-deep">حساب کاربری</p>
            <Dialog.Title className="mt-1 font-heading text-xl font-bold text-navy sm:text-2xl">
              {mode === "login" ? "ورود برای ثبت درخواست" : "ثبت نام برای ثبت درخواست"}
            </Dialog.Title>
            <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
            <Dialog.Description className="mt-3 text-sm leading-7 text-navy/70">
              ثبت درخواست مشاوره فقط پس از ورود یا ایجاد حساب انجام می‌شود. با همان شماره موبایل بعداً
              وضعیت درخواست را می‌بینید.
            </Dialog.Description>
            <div className="mt-5">
              <AuthForm mode={mode} variant="dialog" onModeChange={setMode} />
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
