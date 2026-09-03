"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ErrorNote,
  FieldLabel,
  LawyerHeading,
  OkNote,
  SectionCard,
  Tone,
  inputClass,
  panelCard,
  panelFetch,
  textareaClass,
} from "@/components/lawyer/lawyer-ui";
import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import { buttonVariants } from "@/components/ui/button";
import type { LawyerPanelProfile } from "@/lib/lawyer-profile";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LawyerProfileForm() {
  const [profile, setProfile] = useState<LawyerPanelProfile | null>(null);
  const [form, setForm] = useState({
    headline: "",
    bio: "",
    officeHours: "",
    officePhone: "",
    city: "",
    acceptingNew: true,
    autoAccept: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      const result = await panelFetch<{ item: LawyerPanelProfile }>("/api/lawyer/profile");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      apply(result.data.item);
    })();
  }, []);

  function apply(item: LawyerPanelProfile) {
    setProfile(item);
    setForm({
      headline: item.headline,
      bio: item.bio,
      officeHours: item.officeHours,
      officePhone: item.officePhone,
      city: item.city,
      acceptingNew: item.acceptingNew,
      autoAccept: item.autoAccept,
    });
  }

  async function save() {
    setPending(true);
    setError(null);
    setOkMessage(null);
    const result = await panelFetch<{ item: LawyerPanelProfile }>("/api/lawyer/profile", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    apply(result.data.item);
    setOkMessage("پروفایل ذخیره شد.");
  }

  if (!profile) {
    return <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>{error ?? "در حال بارگذاری…"}</div>;
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="حساب وکیل"
        title="پروفایل من"
        description="این اطلاعات در صفحه عمومی شما و در پنل موکلان دیده می‌شود."
        actions={
          <Link
            href={`/lawyers/${profile.slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-11 border-navy/15 px-4")}
          >
            صفحه عمومی
          </Link>
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="شناسنامه حرفه‌ای" hint="این بخش‌ها توسط دفتر ثبت می‌شود.">
          <div className="flex flex-col items-center text-center">
            <LawyerAvatar src={profile.image} name={profile.name} size={160} className="size-28" />
            <p className="mt-4 font-heading text-lg font-semibold text-navy">{profile.name}</p>
            <p className="mt-1 text-sm text-navy/55">{profile.title}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Tone tone="bg-gold/15 text-gold-deep">{profile.specialty}</Tone>
              <Tone tone="bg-navy/5 text-navy/60">{profile.experience} سابقه</Tone>
              <Tone tone="bg-amber-50 text-amber-800">امتیاز {toFaDigits(profile.rating)}</Tone>
            </div>
            {profile.focus.length ? (
              <ul className="mt-4 flex flex-wrap justify-center gap-2">
                {profile.focus.map((item) => (
                  <li key={item} className="rounded-full border border-navy/10 px-3 py-1 text-[11px] text-navy/60">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="اطلاعات قابل ویرایش">
          <div className="grid gap-3">
            <label className="block">
              <FieldLabel>یک خط معرفی</FieldLabel>
              <input
                value={form.headline}
                onChange={(event) => setForm((c) => ({ ...c, headline: event.target.value }))}
                className={inputClass}
                maxLength={160}
                placeholder="مثلاً: تمرکز بر قراردادهای تجاری و داوری"
              />
            </label>
            <label className="block">
              <FieldLabel>معرفی کامل</FieldLabel>
              <textarea
                value={form.bio}
                onChange={(event) => setForm((c) => ({ ...c, bio: event.target.value }))}
                className={cn(textareaClass, "min-h-32")}
                maxLength={1500}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>ساعات پاسخ‌دهی</FieldLabel>
                <input
                  value={form.officeHours}
                  onChange={(event) => setForm((c) => ({ ...c, officeHours: event.target.value }))}
                  className={inputClass}
                  maxLength={160}
                />
              </label>
              <label className="block">
                <FieldLabel>تلفن دفتر</FieldLabel>
                <input
                  value={form.officePhone}
                  onChange={(event) => setForm((c) => ({ ...c, officePhone: event.target.value }))}
                  className={inputClass}
                  maxLength={40}
                  inputMode="tel"
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel>شهر</FieldLabel>
                <input
                  value={form.city}
                  onChange={(event) => setForm((c) => ({ ...c, city: event.target.value }))}
                  className={inputClass}
                  maxLength={60}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-navy/8 bg-paper/50 p-4">
              <label className="flex items-start gap-3 text-sm text-navy/75">
                <input
                  type="checkbox"
                  checked={form.acceptingNew}
                  onChange={(event) => setForm((c) => ({ ...c, acceptingNew: event.target.checked }))}
                  className="mt-1 size-4 accent-[#c9a227]"
                />
                <span>
                  پذیرش درخواست جدید
                  <span className="mt-1 block text-xs leading-6 text-navy/50">
                    با خاموش کردن این گزینه، در میز کار به شما هشدار داده می‌شود که درخواست تازه نپذیرید.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() => void save()}
            className={cn(buttonVariants(), "mt-4 h-11 bg-navy px-5 text-white hover:bg-navy-mid")}
          >
            ذخیره پروفایل
          </button>

          <ErrorNote>{error}</ErrorNote>
          <OkNote>{okMessage}</OkNote>
        </SectionCard>
      </div>
    </div>
  );
}
