"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  TicketPercentIcon,
  MessageSquareTextIcon,
  PhoneIcon,
  SearchIcon,
  UserRoundPlusIcon,
  VideoIcon,
} from "lucide-react";

import { ChoiceCard } from "@/components/consult/choice-card";
import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceIcon } from "@/components/services/service-icon";
import {
  caseStageMeta,
  caseStages,
  consultableServices,
  consultChannelMeta,
  consultChannels,
  isFreeService,
  serviceFeeToman,
  serviceTitle,
  timeSlotMeta,
  timeSlots,
  urgencyMeta,
  urgencies,
  type CaseStage,
  type ConsultChannel,
  type LawyerMode,
  type TimeSlot,
  type Urgency,
} from "@/lib/consult";
import { lawyers, services, type Lawyer } from "@/lib/data";
import {
  emptyConsultDraft,
  clearLocalConsultDraft,
  readLocalConsultDraft,
  writeLocalConsultDraft,
  type ConsultWizardDraft,
} from "@/lib/consult-draft";
import type { PublicUser } from "@/lib/store";
import { formatToman, toFaDigits } from "@/lib/format";
import { lookupPromo, quotePayment } from "@/lib/promos";
import { cn } from "@/lib/utils";
import { consultationFields, consultationSchema } from "@/lib/validations";

const STEPS = [
  { id: 1, title: "نحوه مشاوره" },
  { id: 2, title: "خدمت و وکیل" },
  { id: 3, title: "شرح موضوع" },
  { id: 4, title: "تماس و زمان" },
  { id: 5, title: "بازبینی" },
  { id: 6, title: "پرداخت" },
] as const;

const LAST_STEP = STEPS.length;

const channelIcons = {
  text: MessageSquareTextIcon,
  phone: PhoneIcon,
  video: VideoIcon,
} as const;

type Draft = ConsultWizardDraft;

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "این مرحله را کامل کنید.";
}

export function ConsultationWizard({
  initialLawyer,
  initialService,
  user,
  embedded = false,
}: {
  initialLawyer?: Lawyer;
  initialService?: string;
  user?: PublicUser | null;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(() =>
    emptyConsultDraft({
      lawyerSlug: initialLawyer?.slug,
      service: initialService,
    }),
  );
  const [stepError, setStepError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [lawyerQuery, setLawyerQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const saveGeneration = useRef(0);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const id = userId;

    const local = readLocalConsultDraft(id);
    if (local) {
      setDraft(local.draft);
      setStep(local.step);
      setPromoApplied(Boolean(lookupPromo(local.draft.discountCode)));
    }

    async function load() {
      try {
        const response = await fetch("/api/consultations/draft", { credentials: "include" });
        const payload = (await response.json()) as { draft?: { step: number; draft: Draft } | null };
        if (cancelled || !payload.draft) return;
        setDraft(payload.draft.draft);
        setStep(payload.draft.step);
        setPromoApplied(Boolean(lookupPromo(payload.draft.draft.discountCode)));
        writeLocalConsultDraft(id, {
          step: payload.draft.step,
          draft: payload.draft.draft,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        /* local draft already applied */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!user) return;
    setDraft((current) => ({
      ...current,
      fullName: current.fullName || user.fullName,
      phone: current.phone || user.phone,
    }));
  }, [user]);

  useEffect(() => {
    if (!hydrated || !userId || trackingCode) return;
    const generation = ++saveGeneration.current;
    const state = { step, draft, updatedAt: new Date().toISOString() };
    writeLocalConsultDraft(userId, state);
    const timer = window.setTimeout(() => {
      if (generation !== saveGeneration.current) return;
      void fetch("/api/consultations/draft", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated, step, trackingCode, userId]);

  const availableServices = consultableServices(services);
  const selectedLawyer = lawyers.find((item) => item.slug === draft.lawyerSlug);
  const originalFeeToman = draft.service ? serviceFeeToman(draft.service) : 0;
  const serviceIsFree = originalFeeToman <= 0;
  const quoted =
    promoApplied && draft.discountCode
      ? quotePayment(originalFeeToman, draft.discountCode)
      : quotePayment(originalFeeToman);
  const payableToman = "error" in quoted ? originalFeeToman : quoted.feeToman;
  const discountToman = "error" in quoted ? 0 : quoted.discountToman;

  const visibleLawyers = useMemo(() => {
    const needle = lawyerQuery.trim();
    return lawyers.filter((lawyer) => {
      if (!needle) return true;
      return (
        lawyer.name.includes(needle) ||
        lawyer.specialty.includes(needle) ||
        lawyer.city.includes(needle)
      );
    });
  }, [lawyerQuery]);

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
    setStepError(null);
  }

  function validateStep(current: number) {
    if (current === 1) {
      if (!draft.channel) return "نحوه مشاوره را انتخاب کنید.";
      return null;
    }
    if (current === 2) {
      if (!draft.service) return "نوع خدمت را انتخاب کنید.";
      if (!draft.lawyerMode) return "انتخاب وکیل یا معرفی توسط اپراتور را مشخص کنید.";
      if (draft.lawyerMode === "chosen" && !draft.lawyerSlug) {
        return "وکیل را انتخاب کنید یا معرفی را به اپراتور بسپارید.";
      }
      return null;
    }
    if (current === 3) {
      if (!draft.caseStage) return "وضعیت فعلی پرونده را مشخص کنید.";
      if (!draft.hasDocuments) return "مشخص کنید سند یا قرارداد دارید یا نه.";
      const parsed = consultationFields
        .pick({
          subject: true,
          message: true,
          urgency: true,
          caseStage: true,
          hasDocuments: true,
          city: true,
        })
        .safeParse({
          subject: draft.subject,
          message: draft.message,
          urgency: draft.urgency,
          caseStage: draft.caseStage,
          hasDocuments: draft.hasDocuments,
          city: draft.city,
        });
      return parsed.success ? null : firstIssue(parsed.error);
    }
    if (current === 4) {
      if (draft.channel !== "text" && !draft.preferredSlot) {
        return "بازه زمانی ترجیحی را انتخاب کنید.";
      }
      const parsed = consultationFields
        .pick({ fullName: true, phone: true, email: true })
        .safeParse({
          fullName: draft.fullName,
          phone: draft.phone,
          email: draft.email,
        });
      return parsed.success ? null : firstIssue(parsed.error);
    }
    if (current === 5) {
      if (!draft.consent) return "برای ثبت درخواست باید شرایط محرمانگی را بپذیرید.";
      return null;
    }
    return null;
  }

  function goNext() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((current) => Math.min(LAST_STEP, current + 1));
  }

  function goTo(next: number) {
    if (next < step) {
      setStepError(null);
      setStep(next);
      return;
    }
    for (let index = 1; index < next; index += 1) {
      const error = validateStep(index);
      if (error) {
        setStep(index);
        setStepError(error);
        return;
      }
    }
    setStep(next);
  }

  async function submit() {
    if (!draft.consent) {
      setStepError("برای ثبت درخواست باید شرایط محرمانگی را بپذیرید.");
      return;
    }
    const parsed = consultationSchema.safeParse({
      ...draft,
      lawyerSlug: draft.lawyerMode === "chosen" ? draft.lawyerSlug : undefined,
      preferredSlot: draft.channel === "text" ? undefined : draft.preferredSlot,
      discountCode: draft.discountCode.trim() || undefined,
      consent: true,
    });
    if (!parsed.success) {
      setStepError(firstIssue(parsed.error));
      return;
    }
    setPending(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as { trackingCode?: string; error?: string };
      if (!response.ok || !payload.trackingCode) {
        setSubmitError(payload.error ?? "ثبت درخواست با خطا روبه‌رو شد.");
        return;
      }
      saveGeneration.current += 1;
      setTrackingCode(payload.trackingCode);
      if (userId) clearLocalConsultDraft(userId);
      await fetch("/api/consultations/draft", { method: "DELETE", credentials: "include" });
      router.refresh();
    } catch {
      setSubmitError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  if (trackingCode) {
    return <SuccessState code={trackingCode} draft={draft} embedded={embedded} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ol className="mb-8 grid grid-cols-6 gap-1 sm:gap-2">
        {STEPS.map((item) => {
          const done = item.id < step;
          const active = item.id === step;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => goTo(item.id)}
                className="flex w-full flex-col items-center gap-2 text-center"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition sm:size-9",
                    done && "bg-navy text-gold",
                    active && "bg-gold text-navy-deep ring-4 ring-gold/20",
                    !done && !active && "bg-white text-navy/40 ring-1 ring-navy/10",
                  )}
                >
                  {done ? <CheckIcon className="size-4" /> : toFaDigits(item.id)}
                </span>
                <span
                  className={cn(
                    "hidden text-[11px] leading-4 sm:block",
                    active ? "font-medium text-navy" : "text-navy/45",
                  )}
                >
                  {item.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div
        className={cn(
          "rounded-3xl bg-white p-5 shadow-lg ring-1 ring-navy/8 sm:p-8",
          embedded && "rounded-2xl bg-paper p-4 shadow-none ring-0 sm:p-6",
        )}
      >
        {step === 1 && (
          <StepShell title="چطور مشاوره بگیرید؟" subtitle="هر مسیر بعد از ثبت، قابل پیگیری است؛ فقط محل گفتگو فرق می‌کند.">
            <div className="grid gap-4 md:grid-cols-3">
              {consultChannels.map((channel) => {
                const meta = consultChannelMeta[channel];
                const Icon = channelIcons[channel];
                return (
                  <ChoiceCard
                    key={channel}
                    selected={draft.channel === channel}
                    title={meta.title}
                    hint={meta.hint}
                    badge={meta.place}
                    icon={<Icon className="size-5" />}
                    onSelect={() => patch({ channel })}
                  />
                );
              })}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            title="خدمت و وکیل"
            subtitle="اگر وکیل انتخاب نکنید، اپراتور بر اساس موضوع متخصص مناسب را مشخص می‌کند. تا تأیید وکیل، نام او نمایش داده نمی‌شود."
          >
            <h3 className="mb-3 font-heading text-sm font-semibold text-navy">نوع خدمت</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableServices.map((service) => (
                <button
                  key={service.slug}
                  type="button"
                  onClick={() => patch({ service: service.slug })}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 text-start transition",
                    draft.service === service.slug
                      ? "border-gold bg-gold/8 ring-1 ring-gold/20"
                      : "border-navy/10 hover:border-navy/25",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                    <ServiceIcon name={service.icon} className="size-4" />
                  </span>
                  <span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="block font-medium text-navy">{service.title}</span>
                      <span className="shrink-0 text-[11px] font-medium text-gold-deep">
                        {formatToman(service.feeToman)}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-navy/60">{service.short}</span>
                  </span>
                </button>
              ))}
            </div>

            <h3 className="mt-8 mb-3 font-heading text-sm font-semibold text-navy">وکیل</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                selected={draft.lawyerMode === "assign"}
                title="معرفی توسط اپراتور"
                hint="وکیل مناسب پس از بررسی موضوع انتخاب می‌شود و تا تأیید او نامش را نمی‌بینید."
                icon={<UserRoundPlusIcon className="size-5" />}
                onSelect={() => patch({ lawyerMode: "assign", lawyerSlug: "" })}
              />
              <ChoiceCard
                selected={draft.lawyerMode === "chosen"}
                title="انتخاب خودم"
                hint="وکیل مدنظر را از فهرست برگزینید. پذیرش نهایی با تأیید اوست."
                icon={<SearchIcon className="size-5" />}
                onSelect={() => patch({ lawyerMode: "chosen" })}
              />
            </div>

            {draft.lawyerMode === "chosen" && (
              <div className="mt-5">
                <label className="relative mb-4 block">
                  <SearchIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-navy/35" />
                  <Input
                    value={lawyerQuery}
                    onChange={(event) => setLawyerQuery(event.target.value)}
                    placeholder="جستجو با نام، تخصص یا شهر"
                    className="h-11 rounded-xl pr-10"
                  />
                </label>
                <div className="grid max-h-[22rem] gap-3 overflow-auto pe-1 sm:grid-cols-2">
                  {visibleLawyers.map((lawyer) => (
                    <button
                      key={lawyer.slug}
                      type="button"
                      onClick={() => patch({ lawyerSlug: lawyer.slug, lawyerMode: "chosen" })}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-3 text-start transition",
                        draft.lawyerSlug === lawyer.slug
                          ? "border-gold bg-gold/8 ring-1 ring-gold/20"
                          : "border-navy/10 hover:border-navy/25",
                      )}
                    >
                      <LawyerAvatar src={lawyer.image} name={lawyer.name} className="size-12" size={96} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-navy">{lawyer.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-navy/55">
                          {lawyer.specialty} · {lawyer.city}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="شرح موضوع حقوقی" subtitle="مدارک محرمانه را فعلاً بارگذاری نکنید؛ پس از هماهنگی مسیر امن اعلام می‌شود.">
            <div className="space-y-5">
              <Field label="موضوع کوتاه" htmlFor="subject">
                <Input
                  id="subject"
                  value={draft.subject}
                  onChange={(event) => patch({ subject: event.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="مثلاً بررسی قرارداد اجاره قبل از امضا"
                />
              </Field>
              <Field label="شرح ماجرا" htmlFor="message">
                <Textarea
                  id="message"
                  rows={6}
                  value={draft.message}
                  onChange={(event) => patch({ message: event.target.value })}
                  className="min-h-32 rounded-xl"
                  placeholder="طرفین، تاریخ‌های مهم، آنچه امضا شده یا قرار است امضا شود، و سؤال اصلیتان را بنویسید."
                />
              </Field>
              <div>
                <p className="mb-2 text-sm font-medium">وضعیت فعلی</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {caseStages.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => patch({ caseStage: stage })}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-start text-sm transition",
                        draft.caseStage === stage
                          ? "border-gold bg-gold/8 text-navy"
                          : "border-navy/10 text-navy/75 hover:border-navy/25",
                      )}
                    >
                      {caseStageMeta[stage]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">فوریت</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {urgencies.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => patch({ urgency: item })}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-start transition",
                        draft.urgency === item
                          ? "border-gold bg-gold/8"
                          : "border-navy/10 hover:border-navy/25",
                      )}
                    >
                      <span className="block text-sm font-medium text-navy">{urgencyMeta[item].title}</span>
                      <span className="mt-1 block text-xs leading-5 text-navy/55">{urgencyMeta[item].hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="شهر پرونده (اختیاری)" htmlFor="city">
                  <Input
                    id="city"
                    value={draft.city}
                    onChange={(event) => patch({ city: event.target.value })}
                    className="h-11 rounded-xl"
                    placeholder="تهران"
                  />
                </Field>
                <div>
                  <p className="mb-2 text-sm font-medium">سند یا قرارداد دارید؟</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["yes", "بله، موجود است"],
                        ["no", "خیر / هنوز نه"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => patch({ hasDocuments: value })}
                        className={cn(
                          "h-11 rounded-xl border text-sm transition",
                          draft.hasDocuments === value
                            ? "border-gold bg-gold/8 text-navy"
                            : "border-navy/10 text-navy/70 hover:border-navy/25",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell
            title="اطلاعات تماس و زمان"
            subtitle={
              draft.channel === "phone"
                ? "تماس را دفتر برقرار می‌کند؛ بازه را طوری انتخاب کنید که در دسترس باشید."
                : "پس از تأیید، ادامه کار در پنل کاربری انجام می‌شود."
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="نام و نام خانوادگی" htmlFor="fullName">
                <Input
                  id="fullName"
                  value={draft.fullName}
                  onChange={(event) => patch({ fullName: event.target.value })}
                  className="h-11 rounded-xl"
                  autoComplete="name"
                />
              </Field>
              <Field label="شماره موبایل" htmlFor="phone">
                <Input
                  id="phone"
                  value={draft.phone}
                  onChange={(event) => patch({ phone: event.target.value })}
                  className="h-11 rounded-xl text-right"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0912xxxxxxx"
                />
              </Field>
              <Field label="ایمیل (اختیاری)" htmlFor="email">
                <Input
                  id="email"
                  value={draft.email}
                  onChange={(event) => patch({ email: event.target.value })}
                  className="h-11 rounded-xl text-right"
                  dir="ltr"
                  type="email"
                  autoComplete="email"
                />
              </Field>
            </div>
            {draft.channel && draft.channel !== "text" && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">بازه زمانی ترجیحی</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => patch({ preferredSlot: slot })}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-start text-sm transition",
                        draft.preferredSlot === slot
                          ? "border-gold bg-gold/8 text-navy"
                          : "border-navy/10 text-navy/75 hover:border-navy/25",
                      )}
                    >
                      {timeSlotMeta[slot]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="بازبینی درخواست" subtitle="هر بخش را می‌توانید قبل از پرداخت اصلاح کنید.">
            <div className="space-y-3">
              <ReviewRow label="نحوه مشاوره" onEdit={() => setStep(1)}>
                {draft.channel ? consultChannelMeta[draft.channel].title : "—"}
                {draft.channel ? ` · ${consultChannelMeta[draft.channel].place}` : ""}
              </ReviewRow>
              <ReviewRow label="خدمت" onEdit={() => setStep(2)}>
                {draft.service ? serviceTitle(draft.service) : "—"}
                {draft.service ? ` · ${formatToman(originalFeeToman)}` : ""}
              </ReviewRow>
              <ReviewRow label="وکیل" onEdit={() => setStep(2)}>
                {draft.lawyerMode === "assign"
                  ? "معرفی توسط اپراتور — تا تأیید وکیل نمایش داده نمی‌شود"
                  : (selectedLawyer?.name ?? "انتخاب نشده")}
              </ReviewRow>
              <ReviewRow label="موضوع" onEdit={() => setStep(3)}>
                {draft.subject || "—"}
              </ReviewRow>
              <ReviewRow label="شرح" onEdit={() => setStep(3)}>
                <span className="line-clamp-4">{draft.message || "—"}</span>
              </ReviewRow>
              <ReviewRow label="وضعیت و فوریت" onEdit={() => setStep(3)}>
                {draft.caseStage ? caseStageMeta[draft.caseStage] : "—"}
                {" · "}
                {urgencyMeta[draft.urgency].title}
                {draft.city ? ` · ${draft.city}` : ""}
                {draft.hasDocuments === "yes" ? " · سند موجود است" : ""}
              </ReviewRow>
              <ReviewRow label="تماس" onEdit={() => setStep(4)}>
                {draft.fullName} · {draft.phone}
                {draft.preferredSlot && draft.channel !== "text"
                  ? ` · ${timeSlotMeta[draft.preferredSlot]}`
                  : ""}
              </ReviewRow>
            </div>
            <label className="mt-6 flex items-start gap-3 rounded-2xl bg-paper p-4 text-sm leading-7 text-navy/75">
              <input
                type="checkbox"
                checked={draft.consent}
                onChange={(event) => patch({ consent: event.target.checked })}
                className="mt-1 size-4 accent-navy"
              />
              <span>
                می‌پذیرم که اطلاعات فقط برای همین درخواست استفاده شود، مدارک هویتی یا قرارداد کامل را تا هماهنگی ارسال
                نکنم، و پاسخ در ساعات کاری انجام شود.
              </span>
            </label>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell
            title={serviceIsFree ? "تأیید نهایی" : "پرداخت"}
            subtitle={
              serviceIsFree
                ? "این خدمت رایگان است؛ با تأیید، درخواست ثبت می‌شود."
                : "کد تخفیف را قبل از پرداخت اعمال کنید. درگاه بانکی هنوز متصل نیست."
            }
          >
            <div className="rounded-2xl border border-navy/10 bg-paper p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                  <CreditCardIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-navy/50">مبلغ قابل پرداخت</p>
                  {discountToman > 0 ? (
                    <>
                      <p className="mt-1 text-sm text-navy/45 line-through">{formatToman(originalFeeToman)}</p>
                      <p className="font-heading text-2xl font-bold text-navy">{formatToman(payableToman)}</p>
                    </>
                  ) : (
                    <p className="mt-1 font-heading text-2xl font-bold text-navy">{formatToman(originalFeeToman)}</p>
                  )}
                  <p className="mt-2 text-sm leading-7 text-navy/70">
                    {draft.service ? serviceTitle(draft.service) : "خدمت انتخاب‌شده"}
                    {draft.channel ? ` · ${consultChannelMeta[draft.channel].title}` : ""}
                  </p>
                </div>
              </div>

              {!serviceIsFree && (
                <div className="mt-5 border-t border-navy/10 pt-5">
                  <Label htmlFor="discountCode">کد تخفیف</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id="discountCode"
                      value={draft.discountCode}
                      onChange={(event) => {
                        patch({ discountCode: event.target.value });
                        setPromoApplied(false);
                        setCouponMessage(null);
                      }}
                      className="h-11 rounded-xl text-right"
                      dir="ltr"
                      placeholder="QEM10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const quotedCode = quotePayment(originalFeeToman, draft.discountCode);
                        if ("error" in quotedCode) {
                          setPromoApplied(false);
                          setCouponMessage(quotedCode.error ?? "کد تخفیف نامعتبر است.");
                          return;
                        }
                        if (!quotedCode.discountCode) {
                          setPromoApplied(false);
                          setCouponMessage("کد تخفیف را وارد کنید.");
                          return;
                        }
                        patch({ discountCode: quotedCode.discountCode });
                        setPromoApplied(true);
                        setCouponMessage(
                          `${quotedCode.promo?.title ?? "تخفیف"} اعمال شد · ${toFaDigits(quotedCode.discountPercent)}٪`,
                        );
                      }}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-11 shrink-0 gap-1 bg-navy px-4 text-white hover:bg-navy-mid",
                      )}
                    >
                      <TicketPercentIcon className="size-4" />
                      اعمال
                    </button>
                  </div>
                  {couponMessage && (
                    <p
                      className={cn(
                        "mt-2 text-sm leading-7",
                        promoApplied ? "text-gold-deep" : "text-destructive",
                      )}
                      role="status"
                    >
                      {couponMessage}
                    </p>
                  )}
                </div>
              )}

              {!serviceIsFree && (
                <p className="mt-5 rounded-xl bg-gold/15 px-4 py-3 text-sm leading-7 text-navy">
                  پس از اتصال درگاه، همین مرحله به پرداخت بانکی می‌رود. فعلاً با تأیید پرداخت، درخواست شما ثبت
                  می‌شود و کد پیگیری می‌گیرید.
                </p>
              )}
            </div>
          </StepShell>
        )}

        {(stepError || submitError) && (
          <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {stepError ?? submitError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setStepError(null);
              setStep((current) => Math.max(1, current - 1));
            }}
            disabled={step === 1}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 gap-1 border-navy/15 px-5 text-navy disabled:opacity-30",
            )}
          >
            <ChevronRightIcon className="size-4" />
            قبلی
          </button>
          {step < LAST_STEP ? (
            <button
              type="button"
              onClick={goNext}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 gap-1 bg-navy px-6 text-white hover:bg-navy-mid",
              )}
            >
              {step === 5 && !serviceIsFree ? "ادامه به پرداخت" : "ادامه"}
              <ChevronLeftIcon className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 bg-gold px-6 text-navy-deep hover:bg-gold-bright disabled:opacity-50",
              )}
            >
              {pending
                ? "در حال ثبت…"
                : payableToman <= 0
                  ? "ثبت درخواست"
                  : "پرداخت و ثبت درخواست"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-navy">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/65">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-3 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-navy/50">{label}</p>
        <button type="button" onClick={onEdit} className="text-xs text-gold-deep hover:underline">
          اصلاح
        </button>
      </div>
      <div className="mt-1 text-sm leading-7 text-navy">{children}</div>
    </div>
  );
}

function SuccessState({
  code,
  draft,
  embedded,
}: {
  code: string;
  draft: Draft;
  embedded?: boolean;
}) {
  const channel = draft.channel ? consultChannelMeta[draft.channel] : null;
  const paid = draft.service ? !isFreeService(draft.service) : false;
  return (
    <div
      className={cn(
        "mx-auto max-w-xl rounded-3xl bg-white px-6 py-10 text-center shadow-lg ring-1 ring-navy/8 sm:px-10",
        embedded && "shadow-none ring-0",
      )}
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-navy text-gold">
        <CheckIcon className="size-6" />
      </span>
      <h2 className="mt-5 font-heading text-2xl font-bold text-navy">درخواست ثبت شد</h2>
      <p className="mt-3 text-sm leading-7 text-navy/65">
        درخواست در پنل شما ذخیره شد.{" "}
        {paid
          ? "پرداخت فعلاً به‌صورت آزمایشی تأیید شده است."
          : "این درخواست رایگان ثبت شد."}{" "}
        {draft.lawyerMode === "assign"
          ? "وکیل پس از تأیید متخصص به شما اعلام می‌شود."
          : "وضعیت پذیرش وکیل پس از بررسی اعلام می‌شود."}
      </p>
      <p className="mt-5 font-heading text-2xl tracking-wide text-gold-deep" dir="ltr">
        {toFaDigits(code)}
      </p>
      {channel && (
        <p className="mt-4 text-sm leading-7 text-navy/65">
          {channel.title}: {channel.hint}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href={`/account/requests/${code}`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 bg-navy px-5 text-white hover:bg-navy-mid",
          )}
        >
          مشاهده در پنل
        </Link>
        <Link
          href="/account/consult"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 border-navy/20 px-5")}
        >
          درخواست دیگر
        </Link>
      </div>
    </div>
  );
}
