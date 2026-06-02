"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string };

type NavLinksProps = {
  items: NavItem[];
  className?: string;
};

export function NavLinks({ items, className }: NavLinksProps) {
  const pathname = usePathname() ?? "/";
  return (
    <nav
      className={cn("hidden items-center gap-1 md:flex", className)}
      aria-label="Primary navigation"
    >
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-white text-ink-950"
                : "text-ink-700 hover:bg-white hover:text-ink-950",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
