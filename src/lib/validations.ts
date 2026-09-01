import { z } from "zod";

import { normalizePhone } from "@/lib/format";

export const consultationSchema = z.object({
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
  service: z.string().min(1, "نوع خدمت را انتخاب کنید."),
  message: z
    .string()
    .trim()
    .min(12, "شرح موضوع باید حداقل ۱۲ نویسه باشد.")
    .max(2000, "شرح موضوع بیش از حد طولانی است."),
});

export type ConsultationInput = z.infer<typeof consultationSchema>;

export const contactSchema = z.object({
  fullName: z.string().trim().min(3, "نام باید حداقل سه نویسه باشد.").max(80),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^09\d{9}$/.test(value), "شماره موبایل معتبر وارد کنید."),
  subject: z.string().trim().min(3, "موضوع را وارد کنید.").max(120),
  message: z.string().trim().min(12, "پیام باید حداقل ۱۲ نویسه باشد.").max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;
