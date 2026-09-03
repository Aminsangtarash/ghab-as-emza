import { FileTextIcon } from "lucide-react";

import { formatFileSize } from "@/lib/format";

export function ConsultDocumentList({
  trackingCode,
  items,
}: {
  trackingCode: string;
  items: { id: string; originalName: string; size: number }[];
}) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`/api/consultations/${encodeURIComponent(trackingCode)}/documents/${item.id}`}
            className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm text-navy ring-1 ring-navy/10 hover:ring-gold/35"
          >
            <FileTextIcon className="size-4 shrink-0 text-gold-deep" />
            <span className="min-w-0 flex-1 truncate">{item.originalName}</span>
            <span className="shrink-0 text-xs text-navy/45">{formatFileSize(item.size)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
