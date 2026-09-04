"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SiteTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
};

export function SiteDataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  pageSize = 10,
  className,
  minWidthClassName = "min-w-[40rem]",
}: {
  columns: SiteTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  pageSize?: number;
  className?: string;
  minWidthClassName?: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [rows.length, pageSize]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  if (rows.length === 0) {
    return <>{empty}</>;
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, rows.length);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="min-w-0 overflow-x-auto">
        <table className={cn("w-full text-sm md:min-w-0", minWidthClassName)}>
          <thead>
            <tr className="border-y border-navy/8 text-start text-[11px] text-navy/40">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "px-4 py-2.5 font-medium md:px-5",
                    column.hideOnMobile && "hidden md:table-cell",
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => (
              <tr key={rowKey(row)} className="border-b border-navy/6 last:border-b-0">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-4 py-3.5 md:px-5",
                      column.hideOnMobile && "hidden md:table-cell",
                      column.className,
                    )}
                  >
                    {column.cell(row, (currentPage - 1) * pageSize + index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/8 px-4 py-3 md:px-5">
          <p className="text-xs text-navy/45">
            نمایش {toFaDigits(from)} تا {toFaDigits(to)} از {toFaDigits(rows.length)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="flex size-9 items-center justify-center rounded-xl border border-navy/12 text-navy/70 transition hover:border-navy/25 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="صفحه قبل"
            >
              <ChevronRightIcon className="size-4" />
            </button>
            <span className="min-w-16 text-center text-xs text-navy/60">
              {toFaDigits(currentPage)} / {toFaDigits(totalPages)}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="flex size-9 items-center justify-center rounded-xl border border-navy/12 text-navy/70 transition hover:border-navy/25 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="صفحه بعد"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SiteTableLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("font-medium text-navy hover:text-gold-deep", className)}>
      {children}
    </Link>
  );
}
