"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: React.ReactNode;
  meta?: React.ReactNode;
  selectedLabel?: React.ReactNode;
  disabled?: boolean;
};

type MultiSelectProps = {
  value: string[];
  options: MultiSelectOption[];
  onValueChange: (value: string[]) => void;
  placeholder?: React.ReactNode;
  emptyText?: React.ReactNode;
  selectedContent?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
};

function MultiSelectTag({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "max-w-full truncate rounded border border-white/10 bg-white/8 px-1.5 py-0.5 text-[10px] leading-4 text-white/70",
        className
      )}
    >
      {children}
    </span>
  );
}

function MultiSelect({
  value,
  options,
  onValueChange,
  placeholder = <span className="text-white/30">无</span>,
  emptyText = "暂无选项",
  selectedContent,
  className,
  triggerClassName,
  contentClassName,
  ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const selectedValueSet = React.useMemo(() => new Set(value), [value]);
  const selectedOptions = options.filter((option) => selectedValueSet.has(option.value));

  React.useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const toggleOption = (option: MultiSelectOption) => {
    if (option.disabled) return;

    const nextValue = selectedValueSet.has(option.value)
      ? value.filter((item) => item !== option.value)
      : [...value, option.value];

    onValueChange(nextValue);
  };

  const defaultSelectedContent =
    selectedOptions.length > 0
      ? selectedOptions.map((option) => (
          <MultiSelectTag key={option.value}>
            {option.selectedLabel ?? option.label}
          </MultiSelectTag>
        ))
      : null;
  const triggerContent = selectedContent ?? defaultSelectedContent ?? placeholder;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        data-state={open ? "open" : "closed"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "group flex min-h-8 w-full items-center justify-between gap-1 rounded-md px-2 py-1.5 text-xs transition-all duration-150",
          "text-white hover:bg-white/8 outline-none",
          "data-[state=open]:bg-green-500/15 data-[state=open]:ring-1 data-[state=open]:ring-green-500/50",
          triggerClassName
        )}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-left">
          {triggerContent}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 text-white/30 transition-all duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-green-400" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className={cn(
            "absolute left-0 top-[calc(100%+6px)] z-[9999] max-h-72 min-w-full overflow-auto rounded-lg border border-white/10 bg-[#1c1c1c] py-1 shadow-2xl shadow-black/60 backdrop-blur-sm",
            contentClassName
          )}
        >
          {options.length > 0 ? (
            options.map((option) => {
              const checked = selectedValueSet.has(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  data-state={checked ? "checked" : "unchecked"}
                  disabled={option.disabled}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "flex w-full cursor-pointer select-none items-center justify-between gap-2 px-3 py-2 text-xs text-white outline-none transition-colors",
                    "hover:bg-white/8 focus:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40",
                    "data-[state=checked]:bg-green-500/15 data-[state=checked]:text-green-400"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2 text-left">
                    {option.meta ? (
                      <span className="shrink-0 text-white/35">{option.meta}</span>
                    ) : null}
                    <span className="truncate">{option.label}</span>
                  </span>
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                      checked
                        ? "border-green-400/50 bg-green-500/20 text-green-300"
                        : "border-white/15 bg-white/5 text-transparent"
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center text-xs text-white/30">{emptyText}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { MultiSelect, MultiSelectTag };
