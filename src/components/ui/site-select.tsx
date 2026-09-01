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
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const selected = value ?? uncontrolled;

  return (
    <>
      {name ? (
        <input type="hidden" name={name} value={selected ?? ""} required={required} />
      ) : null}
      <Select
        value={value}
        defaultValue={defaultValue}
        items={Object.fromEntries(options.map((option) => [option.value, option.label]))}
        onValueChange={(next) => {
          if (next == null) return;
          const nextValue = String(next);
          if (value == null) setUncontrolled(nextValue);
          onValueChange?.(nextValue);
        }}
      >
        <SelectTrigger id={id} className={cn("w-full min-w-44", className)}>
          <SelectValue placeholder={placeholder}>
            {(selectedValue: string | null) =>
              options.find((option) => option.value === selectedValue)?.label ?? placeholder
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false} sideOffset={6}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
