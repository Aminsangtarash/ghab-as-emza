import "server-only";

const SMS_IR_VERIFY_URL = "https://api.sms.ir/v1/send/verify";

export function getSmsIrConfig() {
  const apiKey = process.env.SMS_IR_API_KEY?.trim() ?? "";
  const templateIdRaw = process.env.SMS_IR_TEMPLATE_ID?.trim() ?? "";
  const templateId = Number(templateIdRaw);
  const otpParam = (process.env.SMS_IR_OTP_PARAM?.trim() || "CODE").replace(/^#+|#+$/g, "");
  const devLog =
    process.env.SMS_IR_DEV_LOG?.trim().toLowerCase() === "true" ||
    process.env.NODE_ENV !== "production";

  return {
    apiKey,
    templateId: Number.isFinite(templateId) && templateId > 0 ? templateId : null,
    otpParam,
    configured: Boolean(apiKey && Number.isFinite(templateId) && templateId > 0),
    devLog,
  };
}

export async function sendSmsIrVerifyCode(mobile: string, code: string) {
  const config = getSmsIrConfig();

  if (!config.configured) {
    if (config.devLog) {
      console.info(`[sms.ir][dev] OTP for ${mobile}: ${code}`);
      return { ok: true as const, mode: "dev" as const };
    }
    return {
      ok: false as const,
      error: "سرویس پیامک پیکربندی نشده است. SMS_IR_API_KEY و SMS_IR_TEMPLATE_ID را تنظیم کنید.",
    };
  }

  try {
    const response = await fetch(SMS_IR_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({
        mobile,
        templateId: config.templateId,
        parameters: [{ name: config.otpParam, value: code }],
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      status?: number;
      message?: string;
      data?: unknown;
    } | null;

    if (!response.ok || (payload?.status !== undefined && payload.status !== 1)) {
      if (config.devLog) {
        console.error("[sms.ir] send failed", response.status, payload);
      }
      return {
        ok: false as const,
        error: "ارسال پیامک انجام نشد. کمی بعد دوباره تلاش کنید.",
      };
    }

    return { ok: true as const, mode: "live" as const };
  } catch (error) {
    if (config.devLog) {
      console.error("[sms.ir] network error", error);
    }
    return {
      ok: false as const,
      error: "ارتباط با سرویس پیامک برقرار نشد.",
    };
  }
}
