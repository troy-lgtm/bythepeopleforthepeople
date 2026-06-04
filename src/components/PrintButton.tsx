"use client";

import { Printer } from "lucide-react";

type PrintButtonProps = {
  label?: string;
  className?: string;
};

export function PrintButton({
  label = "Use browser print",
  className = "inline-flex h-10 items-center gap-2 rounded-md border border-record-200 bg-white px-4 text-sm font-semibold text-ink-900 shadow-line hover:border-civic-500",
}: PrintButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
