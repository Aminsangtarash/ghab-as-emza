import "server-only";

import { createHash, randomInt } from "crypto";

import { OTP_LENGTH } from "@/lib/otp-constants";

export { OTP_LENGTH };
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

type OtpPurpose = "login" | "register";

type OtpRecord = {
  hash: string;
  purpose: OtpPurpose;
  fullName?: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
};

const store = new Map<string, OtpRecord>();

function key(phone: string, purpose: OtpPurpose) {
  return `${purpose}:${phone}`;
}

function hashOtp(phone: string, code: string) {
  return createHash("sha256").update(`gae-otp:${phone}:${code}`).digest("hex");
}

function pruneExpired() {
  const now = Date.now();
  for (const [id, record] of store) {
    if (record.expiresAt <= now) store.delete(id);
  }
}

export function generateOtpCode(length = OTP_LENGTH) {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(randomInt(min, max));
}

export function createOtpChallenge(input: {
  phone: string;
  purpose: OtpPurpose;
  code: string;
  fullName?: string;
}) {
  pruneExpired();
  const id = key(input.phone, input.purpose);
  const existing = store.get(id);
  const now = Date.now();

  if (existing && now - existing.sentAt < OTP_RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - existing.sentAt)) / 1000);
    return { error: `برای ارسال مجدد ${waitSec} ثانیه صبر کنید.` as const, retryAfterSec: waitSec };
  }

  store.set(id, {
    hash: hashOtp(input.phone, input.code),
    purpose: input.purpose,
    fullName: input.fullName,
    expiresAt: now + OTP_TTL_MS,
    sentAt: now,
    attempts: 0,
  });

  return { ok: true as const, expiresInSec: Math.floor(OTP_TTL_MS / 1000) };
}

export function verifyOtpChallenge(input: {
  phone: string;
  purpose: OtpPurpose;
  code: string;
}) {
  pruneExpired();
  const id = key(input.phone, input.purpose);
  const record = store.get(id);

  if (!record) {
    return { error: "کد تأیید منقضی شده یا ارسال نشده است." as const };
  }

  if (record.expiresAt <= Date.now()) {
    store.delete(id);
    return { error: "کد تأیید منقضی شده است. دوباره درخواست کنید." as const };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    store.delete(id);
    return { error: "تعداد تلاش‌ها بیش از حد مجاز است. کد جدید درخواست کنید." as const };
  }

  record.attempts += 1;

  if (record.hash !== hashOtp(input.phone, input.code)) {
    store.set(id, record);
    return { error: "کد تأیید نادرست است." as const };
  }

  store.delete(id);
  return { ok: true as const, fullName: record.fullName };
}

export function clearOtpChallenge(phone: string, purpose: OtpPurpose) {
  store.delete(key(phone, purpose));
}

export function getOtpResendWaitSec(phone: string, purpose: OtpPurpose) {
  const record = store.get(key(phone, purpose));
  if (!record) return 0;
  const waitMs = OTP_RESEND_COOLDOWN_MS - (Date.now() - record.sentAt);
  return waitMs > 0 ? Math.ceil(waitMs / 1000) : 0;
}
