import { z } from "zod";

import { normalizePhone } from "@/lib/format";

const consultationFields = z.object({
  channel: z.enum(["text", "phone", "video"]),
  service: z.string().min(1, "نوع خدمت را انتخاب کنید."),
  lawyerMode: z.enum(["chosen", "assign"]),
  lawyerSlug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^[a-z0-9-]+$/.test(value), "شناسه وکیل نامعتبر است."),
  subject: z.string().trim().min(5, "موضوع را کمی دقیق‌تر بنویسید.").max(120),
  message: z
    .string()
    .trim()
    .min(20, "شرح موضوع باید حداقل ۲۰ نویسه باشد.")
    .max(3000, "شرح موضوع بیش از حد طولانی است."),
  urgency: z.enum(["normal", "soon", "urgent"]),
  caseStage: z.enum(["before-sign", "dispute", "in-court", "other"]),
  city: z.string().trim().max(40).optional().transform((value) => (value ? value : undefined)),
  hasDocuments: z.enum(["yes", "no"]),
  preferredSlot: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),
  fullName: z
    .string()
    .trim()
    .min(3, "نام باید حداقل سه نویسه باشد.")
    .max(80, "نام بیش از حد طولانی است."),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^09\d{9}$/.test(value), "شماره موبایل معتبر وارد کنید."),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "ایمیل معتبر نیست.",
    ),
  consent: z.literal(true, { error: "برای ثبت درخواست باید شرایط محرمانگی را بپذیرید." }),
  discountCode: z
    .string()
    .trim()
    .max(24, "کد تخفیف نامعتبر است.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const consultationSchema = consultationFields
  .refine((data) => data.lawyerMode !== "chosen" || Boolean(data.lawyerSlug), {
    message: "وکیل را انتخاب کنید یا معرفی را به اپراتور بسپارید.",
    path: ["lawyerSlug"],
  })
  .refine((data) => data.channel === "text" || Boolean(data.preferredSlot), {
    message: "بازه زمانی ترجیحی را انتخاب کنید.",
    path: ["preferredSlot"],
  });

export { consultationFields };

export type ConsultationInput = z.infer<typeof consultationSchema>;

export const contactSchema = z.object({
  fullName: z.string().trim().min(3, "نام باید حداقل سه نویسه باشد.").max(80),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^09\d{9}$/.test(value), "شماره موبایل معتبر وارد کنید."),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "ایمیل معتبر نیست.",
    ),
  subject: z.string().trim().min(3, "موضوع را وارد کنید.").max(120),
  message: z.string().trim().min(12, "پیام باید حداقل ۱۲ نویسه باشد.").max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;

const phoneField = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((value) => /^09\d{9}$/.test(value), "شماره موبایل معتبر وارد کنید.");

export const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(8, "رمز عبور باید حداقل ۸ نویسه باشد."),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, "نام باید حداقل سه نویسه باشد.").max(80),
  phone: phoneField,
  password: z.string().min(8, "رمز عبور باید حداقل ۸ نویسه باشد."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
