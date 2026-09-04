import { toDateTimeLocalValue } from "@/lib/jalali";

function snapToQuarterHour(date: Date) {
  const next = new Date(date);
  const minute = next.getMinutes();
  const snapped = Math.ceil(minute / 15) * 15;
  if (snapped === 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  } else {
    next.setMinutes(snapped, 0, 0);
  }
  return next;
}

/** پیشنهاد زمان نوبت بعدی: ۱۵ دقیقه بعد از پایان آخرین نوبت، یا امروز اگر نوبتی نباشد. */
export function suggestNextAppointmentLocalValue(
  appointments: Array<{ scheduledAt: string; minutes?: number }>,
  now = new Date(),
) {
  const latestEnd = appointments
    .map((item) => {
      const start = new Date(item.scheduledAt);
      if (Number.isNaN(start.getTime())) return null;
      const durationMs = Math.max(0, (item.minutes ?? 0) * 60_000);
      return new Date(start.getTime() + durationMs);
    })
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  let suggested: Date;
  if (latestEnd) {
    suggested = new Date(latestEnd.getTime() + 15 * 60_000);
  } else {
    suggested = new Date(now);
    suggested.setHours(9, 0, 0, 0);
    if (suggested.getTime() < now.getTime()) {
      suggested = new Date(now);
      suggested.setMinutes(0, 0, 0);
      suggested.setHours(suggested.getHours() + 1);
    }
  }

  if (suggested.getTime() < now.getTime()) {
    suggested = new Date(now.getTime() + 15 * 60_000);
  }

  return toDateTimeLocalValue(snapToQuarterHour(suggested));
}
