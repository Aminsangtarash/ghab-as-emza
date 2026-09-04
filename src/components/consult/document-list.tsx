import { FileTextIcon, Trash2Icon } from "lucide-react";

import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConsultDocumentList({
  trackingCode,
  items,
  onDelete,
  deletingId,
}: {
  trackingCode: string;
  items: { id: string; originalName: string; size: number }[];
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm text-navy ring-1 ring-navy/10"
        >
          <a
            href={`/api/consultations/${encodeURIComponent(trackingCode)}/documents/${item.id}`}
            className="flex min-w-0 flex-1 items-center gap-3 hover:text-navy"
          >
            <FileTextIcon className="size-4 shrink-0 text-gold-deep" />
            <span className="min-w-0 flex-1 truncate">{item.originalName}</span>
            <span className="shrink-0 text-xs text-navy/45">{formatFileSize(item.size)}</span>
          </a>
          {onDelete ? (
            <button
              type="button"
              disabled={deletingId === item.id}
              onClick={() => onDelete(item.id)}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg text-red-700 transition hover:bg-red-50",
                deletingId === item.id && "opacity-50",
              )}
              aria-label="حذف فایل از پرونده"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
