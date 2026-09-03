"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LockIcon, Trash2Icon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  OkNote,
  SectionCard,
  Tone,
  panelCard,
  panelFetch,
  textareaClass,
} from "@/components/lawyer/lawyer-ui";
import { buttonVariants } from "@/components/ui/button";
import { formatFaDateTime } from "@/lib/format";
import type { LawyerNoteItem } from "@/lib/lawyer-desk";
import { cn } from "@/lib/utils";

export function LawyerNotes() {
  const [items, setItems] = useState<LawyerNoteItem[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const result = await panelFetch<{ items: LawyerNoteItem[] }>("/api/lawyer/notes");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setItems(result.data.items);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    if (!text.trim()) return;
    setPending(true);
    const result = await panelFetch("/api/lawyer/notes", {
      method: "POST",
      body: JSON.stringify({ body: text }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setText("");
    setOkMessage("یادداشت ثبت شد.");
    await load();
  }

  async function remove(id: string) {
    setPending(true);
    const result = await panelFetch(`/api/lawyer/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="دفتر کار"
        title="یادداشت‌ها"
        description="یادداشت‌های خصوصی شما درباره گفتگوها، پرونده‌ها یا کارهای روزانه. موکل هیچ‌یک از این‌ها را نمی‌بیند."
      />

      <SectionCard title="یادداشت جدید" action={<Tone tone="bg-navy/5 text-navy/55">فقط شما</Tone>}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className={textareaClass}
          maxLength={4000}
          placeholder="مثلاً: پیگیری استعلام ثبتی تا پنجشنبه"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => void add()}
          className={cn(buttonVariants(), "mt-3 h-10 bg-navy px-5 text-white hover:bg-navy-mid")}
        >
          <LockIcon className="size-4" />
          ثبت یادداشت
        </button>
      </SectionCard>

      <ErrorNote>{error}</ErrorNote>
      <OkNote>{okMessage}</OkNote>

      {items === null ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className={cn(panelCard, "px-6 py-10")}>
          <EmptyRow>یادداشتی ثبت نشده است.</EmptyRow>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className={cn(panelCard, "px-5 py-4")}>
              <p className="whitespace-pre-line text-sm leading-7 text-navy/75">{item.body}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-navy/40">
                <span className="flex flex-wrap items-center gap-3">
                  <span>{formatFaDateTime(item.createdAt)}</span>
                  {item.clientName ? <span>موکل: {item.clientName}</span> : null}
                  {item.conversationId ? (
                    <Link href={`/lawyer/chats/${item.conversationId}`} className="text-navy/60 hover:text-navy">
                      گفتگو
                    </Link>
                  ) : null}
                  {item.caseId ? (
                    <Link href={`/lawyer/cases/${item.caseId}`} className="text-navy/60 hover:text-navy">
                      پرونده
                    </Link>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void remove(item.id)}
                  className="flex items-center gap-1 text-red-700 hover:underline"
                >
                  <Trash2Icon className="size-3" />
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
