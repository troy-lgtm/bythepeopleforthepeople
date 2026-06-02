"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string };

type MobileMenuProps = {
  items: NavItem[];
  trustLinks: NavItem[];
};

export function MobileMenu({ items, trustLinks }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 10);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-record-200 bg-white text-ink-700 shadow-line transition hover:border-civic-500 md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-paper-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div className="flex items-center justify-between border-b border-record-200 px-4 py-3">
            <span className="text-sm font-semibold text-ink-950">
              Navigation
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="rounded-md p-2 text-ink-700 hover:bg-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav
            aria-label="Mobile primary navigation"
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Sections
            </p>
            <ul className="mt-3 grid gap-2">
              {items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-3 py-3 text-base font-semibold transition",
                        isActive
                          ? "bg-white text-ink-950 shadow-line"
                          : "text-ink-800 hover:bg-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
              Trust
            </p>
            <ul className="mt-3 grid gap-2">
              {trustLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className="block rounded-md px-3 py-3 text-sm font-semibold text-ink-700 transition hover:bg-white hover:text-ink-950"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </>
  );
}
