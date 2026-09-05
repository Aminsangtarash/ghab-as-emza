"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { StarRatingInput, Stars } from "@/components/lawyers/stars";
import { buttonVariants } from "@/components/ui/button";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConversationRatingDialog({
  open,
  onOpenChange,
  lawyerName,
  subject,
  conversationId,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lawyerName: string;
  subject: string;
  conversationId: string;
  onSubmitted: (score: number) => void;
}) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScore(0);
    setComment("");
    setError(null);
    setPending(false);
    setDone(false);
  }, [open, conversationId]);

  async function submit() {
    if (score < 1) {
      setError("لطفاً امتیاز ستاره‌ای خود را انتخاب کنید.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/rating`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment: comment.trim() || undefined }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "امتیاز ثبت نشد.");
        return;
      }
      setDone(true);
      onSubmitted(score);
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-navy-deep/55 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup className="relative my-auto w-full max-w-md overflow-hidden rounded-[1.6rem] bg-white shadow-2xl ring-1 ring-navy/10 outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="bg-gradient-to-b from-gold-wash/80 to-white px-6 pb-4 pt-6 sm:px-7 sm:pt-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gold-deep">پایان مشاوره</p>
                  <Dialog.Title className="mt-1 font-heading text-xl font-bold text-navy sm:text-2xl">
                    {done ? "ممنون از بازخورد شما" : "امتیاز به این مشاوره"}
                  </Dialog.Title>
                </div>
                <Dialog.Close
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-navy/10 text-navy/50 transition hover:bg-white hover:text-navy"
                  aria-label="بستن"
                >
                  <XIcon className="size-4" />
                </Dialog.Close>
              </div>
              <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
              <Dialog.Description className="mt-3 text-sm leading-7 text-navy/65">
                {done
                  ? `امتیاز ${toFaDigits(score)} از ۵ برای «${lawyerName}» ثبت شد.`
                  : `گفتگو بسته شده است. نظرتان درباره مشاوره «${subject}» با ${lawyerName} چیست؟`}
              </Dialog.Description>
            </div>

            <div className="space-y-5 px-6 py-5 sm:px-7 sm:pb-7">
              {done ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-navy/[0.03] px-4 py-8">
                  <Stars rating={score} size="md" className="gap-1 text-gold" />
                  <p className="text-sm text-navy/60">نظر شما به بهبود کیفیت خدمات کمک می‌کند.</p>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className={cn(buttonVariants(), "mt-2 h-11 w-full bg-navy text-white hover:bg-navy-mid")}
                  >
                    بستن
                  </button>
                </div>
              ) : (
                <>
                  <StarRatingInput value={score} onChange={setScore} disabled={pending} />

                  <div className="space-y-1.5">
                    <label htmlFor="rating-comment" className="text-sm font-medium text-navy/70">
                      نظر کوتاه <span className="font-normal text-navy/40">(اختیاری)</span>
                    </label>
                    <textarea
                      id="rating-comment"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      disabled={pending}
                      rows={3}
                      maxLength={500}
                      placeholder="چه چیزی مفید بود؟ چه چیزی می‌توانست بهتر باشد؟"
                      className="w-full resize-none rounded-xl border border-navy/12 bg-paper/60 px-3.5 py-3 text-sm leading-7 text-navy outline-none transition placeholder:text-navy/35 focus:border-gold/50 focus:bg-white focus:ring-2 focus:ring-gold/20 disabled:opacity-60"
                    />
                  </div>

                  {error ? (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm leading-7 text-red-800" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    disabled={pending || score < 1}
                    onClick={() => void submit()}
                    className={cn(
                      buttonVariants(),
                      "h-12 w-full bg-navy text-base text-white hover:bg-navy-mid disabled:opacity-50",
                    )}
                  >
                    {pending ? "در حال ثبت…" : "ثبت امتیاز"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onOpenChange(false)}
                    className="w-full text-center text-sm text-navy/50 transition hover:text-navy"
                  >
                    بعداً امتیاز می‌دهم
                  </button>
                </>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
