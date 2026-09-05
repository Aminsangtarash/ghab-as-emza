"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SiteSelectOption = {
  value: string;
  label: string;
};

export function SiteSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  placeholder = "انتخاب کنید",
  id,
  required,
  invalid,
  className,
}: {
  options: readonly SiteSelectOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue ?? null);
  const selected = isControlled ? value : internal;
  const labels = Object.fromEntries(options.map((option) => [option.value, option.label]));

  return (
    <Select
      value={selected}
      name={name}
      required={required}
      items={labels}
      onValueChange={(next) => {
        if (next == null) return;
        const nextValue = String(next);
        if (!isControlled) setInternal(nextValue);
        onValueChange?.(nextValue);
      }}
    >
      <SelectTrigger
        id={id}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full min-w-44",
          invalid && "border-red-400 bg-red-50/40 ring-2 ring-red-200/80",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false} sideOffset={6}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
