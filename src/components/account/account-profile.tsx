"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CameraIcon,
  CheckIcon,
  CreditCardIcon,
  KeyRoundIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserIcon,
  WalletIcon,
} from "lucide-react";

import { UserAvatar } from "@/components/account/user-avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountRoleLabel } from "@/lib/account";
import { formatFaDate, formatFaDateTime, formatToman, toFaDigits } from "@/lib/format";
import type { PublicUser } from "@/lib/store-types";
import { cn } from "@/lib/utils";

const card = "rounded-[1.25rem] bg-white shadow-sm ring-1 ring-navy/8";

type WalletItem = { id: string; amount: number; reason: string; createdAt: Date; note: string | null };

export function AccountProfile({
  user,
  walletEntries,
}: {
  user: PublicUser;
  walletEntries: WalletItem[];
}) {
  const router = useRouter();
  const { refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [avatarPending, setAvatarPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function syncUser() {
    await refresh();
    router.refresh();
  }

  async function onSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, address }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "ذخیره اطلاعات انجام نشد.");
        return;
      }
      setEditing(false);
      setMessage("اطلاعات حساب به‌روز شد.");
      await syncUser();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  async function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setAvatarPending(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/account/avatar", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "بارگذاری تصویر انجام نشد.");
        return;
      }
      setMessage("تصویر پروفایل ذخیره شد.");
      await syncUser();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setAvatarPending(false);
    }
  }

  async function onChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "تغییر رمز انجام نشد.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setPasswordOpen(false);
      setMessage("رمز عبور تغییر کرد.");
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  function cancelEdit() {
    setFullName(user.fullName);
    setEmail(user.email ?? "");
    setAddress(user.address ?? "");
    setEditing(false);
  }

  const displayName = editing ? fullName : user.fullName;
  const displayEmail = editing ? email : user.email;
  const displayAddress = editing ? address : user.address;

  return (
    <div className="space-y-4 md:space-y-5">
      <h1 className="sr-only">حساب کاربری</h1>
      {(message || error) && (
        <p
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            error ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100",
          )}
        >
          {error ?? message}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_16.5rem]">
        <section className={cn(card, "p-5 sm:p-6")}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative mx-auto w-fit shrink-0 sm:mx-0">
                <UserAvatar user={user} size="lg" />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => void onAvatarChange(event)}
                />
                <button
                  type="button"
                  disabled={avatarPending}
                  onClick={() => fileRef.current?.click()}
                  aria-label="بارگذاری تصویر پروفایل"
                  className="absolute -bottom-0.5 -left-0.5 flex size-9 items-center justify-center rounded-full bg-gold text-navy-deep shadow-sm ring-2 ring-white disabled:opacity-60"
                >
                  <CameraIcon className="size-4" />
                </button>
              </div>

              {editing ? (
                <form id="profile-form" onSubmit={(event) => void onSaveProfile(event)} className="min-w-0 flex-1 space-y-3">
                  <Field label="نام و نام خانوادگی">
                    <Input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      className="h-10 rounded-xl border-navy/12"
                    />
                  </Field>
                  <Field label="ایمیل">
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      dir="ltr"
                      placeholder="name@example.com"
                      className="h-10 rounded-xl border-navy/12"
                    />
                  </Field>
                  <Field label="شماره همراه">
                    <Input value={toFaDigits(user.phone)} readOnly dir="ltr" className="h-10 rounded-xl border-navy/12 bg-paper text-navy/60" />
                    <p className="mt-1 text-[11px] text-navy/45">شماره همراه قابل تغییر نیست.</p>
                  </Field>
                  <Field label="آدرس">
                    <Input
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="شهر، خیابان..."
                      className="h-10 rounded-xl border-navy/12"
                    />
                  </Field>
                </form>
              ) : (
                <ul className="min-w-0 flex-1 space-y-3 text-sm">
                  <InfoRow icon={UserIcon} label="نام و نام خانوادگی" value={displayName || "—"} />
                  <InfoRow icon={MailIcon} label="ایمیل" value={displayEmail || "هنوز وارد نشده"} />
                  <InfoRow icon={PhoneIcon} label="شماره همراه" value={toFaDigits(user.phone)} ltr />
                  <InfoRow icon={MapPinIcon} label="آدرس" value={displayAddress || "هنوز وارد نشده"} />
                </ul>
              )}
            </div>

            <div className="flex shrink-0 gap-2 lg:flex-col">
              {editing ? (
                <>
                  <button
                    type="submit"
                    form="profile-form"
                    disabled={pending}
                    className={cn(buttonVariants(), "h-10 flex-1 bg-navy px-4 text-white hover:bg-navy-mid lg:flex-none")}
                  >
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className={cn(buttonVariants({ variant: "outline" }), "h-10 flex-1 border-navy/15 px-4 lg:flex-none")}
                  >
                    انصراف
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={cn(buttonVariants(), "h-10 bg-navy px-4 text-white hover:bg-navy-mid")}
                >
                  <PencilIcon className="size-4" />
                  ویرایش پروفایل
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className={cn(card, "p-5")}>
          <h2 className="font-heading text-sm font-semibold text-navy">جزئیات حساب</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <MetaRow label="تاریخ عضویت" value={formatFaDate(user.createdAt)} />
            <MetaRow
              label="آخرین ورود"
              value={user.lastLoginAt ? formatFaDateTime(user.lastLoginAt) : "هنوز ثبت نشده"}
            />
            <div className="flex items-center justify-between gap-3">
              <dt className="text-navy/50">وضعیت حساب</dt>
              <dd className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">فعال</dd>
            </div>
            <MetaRow label="سطح کاربری" value={accountRoleLabel(user.role)} />
          </dl>
        </aside>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickTile href="/account" icon={BellIcon} title="تنظیم اعلان‌ها" hint="وضعیت درخواست‌ها در داشبورد" />
        <QuickTile href="/account/wallet" icon={CreditCardIcon} title="اطلاعات پرداخت" hint="موجودی و گردش کیف پول" />
        <QuickTile title="تأیید دو مرحله‌ای" hint="به‌زودی فعال می‌شود" icon={ShieldIcon} disabled />
        <button
          type="button"
          onClick={() => setPasswordOpen((open) => !open)}
          className={cn(card, "flex items-center justify-between gap-3 p-4 text-start transition hover:ring-gold/30")}
        >
          <span>
            <span className="block text-sm font-semibold text-navy">تغییر رمز عبور</span>
            <span className="mt-1 block text-xs text-navy/50">رمز ورود به پنل را عوض کنید</span>
          </span>
          <span className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <KeyRoundIcon className="size-5" />
          </span>
        </button>
      </div>

      {passwordOpen ? (
        <form onSubmit={(event) => void onChangePassword(event)} className={cn(card, "max-w-xl space-y-3 p-5")}>
          <h2 className="font-heading text-sm font-semibold text-navy">تغییر رمز عبور</h2>
          <div>
            <Label htmlFor="currentPassword" className="text-navy/70">
              رمز فعلی
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              minLength={8}
              className="mt-1.5 h-10 rounded-xl border-navy/12"
            />
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-navy/70">
              رمز جدید
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              className="mt-1.5 h-10 rounded-xl border-navy/12"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={cn(buttonVariants(), "h-10 bg-navy px-5 text-white hover:bg-navy-mid")}
          >
            ذخیره رمز جدید
          </button>
        </form>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cn(card, "p-5 sm:p-6")}>
          <p className="text-xs font-medium text-navy/45">کیف پول</p>
          <p className="mt-2 font-heading text-2xl font-bold text-navy sm:text-3xl">{formatToman(user.walletBalance)}</p>
          <p className="mt-1 text-xs text-navy/50">موجودی قابل استفاده در درخواست‌های بعدی</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/account/wallet" className={cn(buttonVariants(), "h-10 bg-navy px-4 text-white hover:bg-navy-mid")}>
              <WalletIcon className="size-4" />
              شارژ کیف پول
            </Link>
            <Link
              href="/account/wallet"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 border-navy/15 px-4")}
            >
              تراکنش‌ها
            </Link>
          </div>
        </section>

        <section className={cn(card, "p-5 sm:p-6")}>
          <h2 className="font-heading text-sm font-semibold text-navy">امنیت حساب</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <SecurityRow label="رمز عبور" value="فعال" ok />
            <SecurityRow label="تأیید دو مرحله‌ای" value="غیرفعال" />
            <SecurityRow label="شماره همراه" value="ثبت‌شده" ok />
          </ul>
        </section>
      </div>

      <section className={cn(card, "overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="font-heading text-sm font-semibold text-navy">گردش اخیر کیف پول</h2>
          <Link href="/account/wallet" className="text-xs font-medium text-gold-deep hover:underline">
            مشاهده همه
          </Link>
        </div>
        {walletEntries.length === 0 ? (
          <p className="px-5 pb-5 text-sm leading-7 text-navy/55">
            هنوز تراکنشی ثبت نشده. اگر درخواستی لغو شود، مبلغ به همین کیف پول برمی‌گردد.
          </p>
        ) : (
          <ul className="divide-y divide-navy/6">
            {walletEntries.slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{item.note ?? item.reason}</p>
                  <p className="mt-0.5 text-xs text-navy/45">{formatFaDateTime(item.createdAt.toISOString())}</p>
                </div>
                <p className="shrink-0 font-medium text-navy">{formatToman(item.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-navy/50">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-navy/45">{label}</p>
        <p className="mt-0.5 font-medium text-navy" dir={ltr ? "ltr" : undefined}>
          {value}
        </p>
      </div>
    </li>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-navy/50">{label}</dt>
      <dd className="text-end text-navy">{value}</dd>
    </div>
  );
}

function QuickTile({
  href,
  icon: Icon,
  title,
  hint,
  disabled,
}: {
  href?: string;
  icon: typeof BellIcon;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span>
        <span className="block text-sm font-semibold text-navy">{title}</span>
        <span className="mt-1 block text-xs text-navy/50">{hint}</span>
      </span>
      <span className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
        <Icon className="size-5" />
      </span>
    </>
  );

  if (disabled || !href) {
    return (
      <div className={cn(card, "flex items-center justify-between gap-3 p-4 opacity-70")}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={cn(card, "flex items-center justify-between gap-3 p-4 transition hover:ring-gold/30")}>
      {inner}
    </Link>
  );
}

function SecurityRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-navy">
        {ok ? (
          <CheckIcon className="size-4 text-emerald-600" />
        ) : (
          <ShieldCheckIcon className="size-4 text-navy/30" />
        )}
        {label}
      </span>
      <span className={cn("text-xs", ok ? "text-emerald-700" : "text-navy/45")}>{value}</span>
    </li>
  );
}
