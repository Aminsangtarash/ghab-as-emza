"use client";

import { useCallback, useEffect, useState } from "react";
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
import { SiteDataTable, SiteTableLink } from "@/components/ui/site-data-table";
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
      ) : (
        <div className={cn(panelCard, "overflow-hidden p-0")}>
          <SiteDataTable
            rows={items}
            rowKey={(item) => item.id}
            pageSize={10}
            minWidthClassName="min-w-[40rem]"
            empty={
              <div className="p-6">
                <EmptyRow>یادداشتی ثبت نشده است.</EmptyRow>
              </div>
            }
            columns={[
              {
                id: "body",
                header: "متن",
                headerClassName: "text-right",
                className: "max-w-[20rem] text-right",
                cell: (item) => <p className="line-clamp-2 whitespace-pre-line text-navy/75">{item.body}</p>,
              },
              {
                id: "client",
                header: "موکل",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => item.clientName ?? "—",
              },
              {
                id: "date",
                header: "تاریخ",
                className: "whitespace-nowrap text-center text-navy/50",
                cell: (item) => formatFaDateTime(item.createdAt),
              },
              {
                id: "links",
                header: "پیوند",
                hideOnMobile: true,
                className: "text-center",
                cell: (item) => (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    {item.conversationId ? (
                      <SiteTableLink href={`/lawyer/chats/${item.conversationId}`}>گفتگو</SiteTableLink>
                    ) : null}
                    {item.caseId ? (
                      <SiteTableLink href={`/lawyer/cases/${item.caseId}`}>پرونده</SiteTableLink>
                    ) : null}
                    {!item.conversationId && !item.caseId ? <span className="text-navy/35">—</span> : null}
                  </div>
                ),
              },
              {
                id: "actions",
                header: "اقدام",
                className: "text-center",
                cell: (item) => (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void remove(item.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline"
                  >
                    <Trash2Icon className="size-3" />
                    حذف
                  </button>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
